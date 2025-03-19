
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import CommentModeration from './CommentModeration';
import CommentDisplay from './CommentDisplay';

interface Profile {
  first_name: string;
  last_name: string;
}

interface Comment {
  id: string;
  user_id: string;
  news_id: string;
  content: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  updated_at: string;
  profiles?: Profile;
}

interface CommentsContainerProps {
  newsId: string;
}

const CommentsContainer: React.FC<CommentsContainerProps> = ({ newsId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const { user, isModerator } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Fetching comments for news ID:', newsId);
    fetchComments();
  }, [newsId, showAllComments]);

  const fetchComments = async () => {
    try {
      // First, fetch the comments
      let query = supabase
        .from('comments')
        .select('*')
        .eq('news_id', newsId);

      if (!isModerator && !showAllComments) {
        query = query.eq('status', 'approved');
      }
      
      query = query.order('created_at', { ascending: false });

      const { data: commentsData, error: commentsError } = await query;

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        throw commentsError;
      }
      
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }
      
      console.log('Fetched comments:', commentsData);
      
      // Now fetch profiles for these comments
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Continue without profiles
      }
      
      // Create a map of user_id to profile data
      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});
      
      // Combine comments with their profile data
      const commentsWithProfiles = commentsData.map(comment => {
        const profile = profilesMap[comment.user_id];
        return {
          ...comment,
          profiles: profile ? {
            first_name: profile.first_name,
            last_name: profile.last_name
          } : undefined
        };
      });
      
      setComments(commentsWithProfiles as Comment[]);
    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Connectez-vous pour commenter',
        description: 'Vous devez être connecté pour ajouter un commentaire',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: 'Commentaire vide',
        description: 'Veuillez entrer un commentaire',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .insert([
          { 
            user_id: user.id, 
            news_id: newsId, 
            content: newComment.trim(),
            status: 'pending'
          }
        ])
        .select();

      if (commentError) {
        console.error('Error inserting comment:', commentError);
        throw commentError;
      }
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }
      
      const newCommentWithProfile = {
        ...commentData[0],
        profiles: profileData
      } as Comment;
      
      if (isModerator || showAllComments) {
        setComments([newCommentWithProfile, ...comments]);
      }
      
      setNewComment('');
      toast({
        title: 'Commentaire soumis',
        description: isModerator ? 
          'Votre commentaire a été publié' : 
          'Votre commentaire a été soumis et est en attente de validation par un modérateur'
      });
      
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive'
      });
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleModerateComment = async (commentId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) {
        throw error;
      }

      setComments(comments.map(comment => 
        comment.id === commentId ? { ...comment, status: newStatus } : comment
      ));

      toast({
        title: newStatus === 'approved' ? 'Commentaire approuvé' : 'Commentaire rejeté',
        description: newStatus === 'approved' ? 
          'Le commentaire est maintenant visible pour tous les utilisateurs' : 
          'Le commentaire a été rejeté et ne sera pas visible publiquement'
      });
      
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Erreur de modération',
        description: error.message || 'Une erreur est survenue lors de la modération',
        variant: 'destructive'
      });
      console.error('Error moderating comment:', error);
    }
  };

  return (
    <div className="mt-12 border-t border-getigne-100 pt-8">
      <h3 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6" />
        Commentaires ({comments.length})
      </h3>

      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <Textarea
            placeholder="Partagez votre avis..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-3 h-24"
          />
          <Button 
            type="submit" 
            disabled={submitting}
            className="bg-getigne-accent hover:bg-getigne-accent/90"
          >
            {submitting ? 'Publication...' : 'Publier un commentaire'}
          </Button>
          {!isModerator && (
            <p className="text-sm text-getigne-500 mt-2">
              Note: Votre commentaire sera visible après validation par un modérateur.
            </p>
          )}
        </form>
      ) : (
        <div className="bg-getigne-50 p-4 rounded-md mb-8">
          <p className="text-getigne-700 mb-3">Connectez-vous pour ajouter un commentaire</p>
          <Button 
            onClick={() => navigate('/auth')}
            className="bg-getigne-accent hover:bg-getigne-accent/90"
          >
            Se connecter / S'inscrire
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Chargement des commentaires...</div>
      ) : isModerator ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Modération des commentaires</h3>
            <div className="flex items-center gap-2">
              <Switch
                checked={showAllComments}
                onCheckedChange={setShowAllComments}
                id="show-pending"
              />
              <label htmlFor="show-pending" className="text-sm text-getigne-700">
                {showAllComments ? "Tous les commentaires" : "Commentaires approuvés uniquement"}
              </label>
            </div>
          </div>
          <CommentModeration 
            comments={comments} 
            onModerate={handleModerateComment} 
          />
        </>
      ) : (
        <CommentDisplay comments={comments} />
      )}
    </div>
  );
};

export default CommentsContainer;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  profiles?: Profile;
}

interface CommentsProps {
  newsId: string;
}

const Comments: React.FC<CommentsProps> = ({ newsId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchComments();
  }, [newsId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name
          )
        `)
        .eq('news_id', newsId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Comment interface
      const transformedData = data?.map(item => ({
        ...item,
        profiles: item.profiles as unknown as Profile
      })) || [];
      
      setComments(transformedData);
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
      // Insert the new comment
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .insert([
          { user_id: user.id, news_id: newsId, content: newComment.trim() }
        ])
        .select();

      if (commentError) throw commentError;
      
      // Fetch the profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Combine the comment and profile data
      const newCommentWithProfile = {
        ...commentData[0],
        profiles: profileData
      };
      
      setComments([newCommentWithProfile, ...comments]);
      setNewComment('');
      toast({
        title: 'Commentaire publié',
        description: 'Votre commentaire a été publié avec succès'
      });
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

  // Helper function to get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div 
              key={comment.id} 
              className="bg-white p-5 rounded-lg shadow-sm border border-getigne-100"
            >
              <div className="flex items-center gap-2 mb-3">
                <Avatar className="h-10 w-10 bg-getigne-100">
                  <AvatarFallback className="text-getigne-700">
                    {comment.profiles ? getInitials(comment.profiles.first_name, comment.profiles.last_name) : 'UN'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">
                    {comment.profiles ? `${comment.profiles.first_name} ${comment.profiles.last_name}` : 'Utilisateur'}
                  </h4>
                  <time className="text-getigne-500 text-sm">
                    {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </time>
                </div>
              </div>
              <p className="text-getigne-700">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-getigne-500">
          Soyez le premier à commenter cet article
        </div>
      )}
    </div>
  );
};

export default Comments;

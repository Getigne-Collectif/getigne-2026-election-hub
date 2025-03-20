
import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import CommentForm from './CommentForm';
import UserView from './UserView';
import ModeratorView from './ModeratorView';

interface Profile {
  first_name: string;
  last_name: string;
  avatar_url?: string;
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

interface CommentsProps {
  newsId: string;
}

const Comments: React.FC<CommentsProps> = ({ newsId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllComments, setShowAllComments] = useState(false);
  const { user, isModerator } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    console.log('Fetching comments for news ID:', newsId);
    fetchComments();
  }, [newsId, showAllComments]);

  const fetchComments = async () => {
    try {
      // Fetch comments
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
      
      // Since we can't use a JOIN due to apparent relationship issues,
      // fetch profiles separately and combine them manually
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
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
            last_name: profile.last_name,
            avatar_url: profile.avatar_url
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

      <CommentForm 
        newsId={newsId} 
        onCommentSubmitted={fetchComments} 
      />

      {loading ? (
        <div className="text-center py-8">Chargement des commentaires...</div>
      ) : isModerator ? (
        <ModeratorView 
          comments={comments}
          showAllComments={showAllComments}
          setShowAllComments={setShowAllComments}
          onModerateComment={handleModerateComment}
        />
      ) : (
        <UserView comments={comments} />
      )}
    </div>
  );
};

export default Comments;

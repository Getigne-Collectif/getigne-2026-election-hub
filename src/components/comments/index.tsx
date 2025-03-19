
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
      let query = supabase
        .from('comments')
        .select(`
          *,
          profiles:profiles(first_name, last_name)
        `)
        .eq('news_id', newsId);

      if (!isModerator && !showAllComments) {
        query = query.eq('status', 'approved');
      }
      
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }
      
      console.log('Fetched comments:', data);
      
      const transformedData = data?.map(item => {
        let profileData: Profile | undefined = undefined;
        
        if (item.profiles) {
          if (Array.isArray(item.profiles) && item.profiles.length > 0) {
            profileData = item.profiles[0];
          } else if (typeof item.profiles === 'object' && 'first_name' in item.profiles) {
            profileData = item.profiles as unknown as Profile;
          }
        }
        
        return {
          ...item,
          profiles: profileData
        };
      }) || [];
      
      setComments(transformedData as Comment[]);
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

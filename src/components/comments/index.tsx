
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase, TABLES } from '@/integrations/supabase/client';
import CommentForm from './CommentForm';
import { Separator } from '@/components/ui/separator';
import ModeratorView from './ModeratorView';
import UserView from './UserView';
import { Comment } from '@/types/comments.types';

interface CommentsProps {
  newsId?: string;
  programItemId?: string;
  programPointId?: string;
}

const Comments: React.FC<CommentsProps> = ({ newsId, programItemId, programPointId }) => {
  const { user, userRoles, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [view, setView] = useState<'all' | 'pending'>('all');
  const isModerator = isAdmin || userRoles.includes('moderator');

  const getSourceType = () => {
    if (newsId) return 'news';
    if (programPointId) return 'program_point';
    if (programItemId) return 'program';
    return 'news';
  };

  const sourceType = getSourceType();

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsId, programItemId, programPointId, view]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      let query: any;

      if (newsId) {
        // Fetch comments for news
        query = supabase
          .from('comments')
          .select('*, profiles(*)')
          .eq('news_id', newsId)
          .order('created_at', { ascending: false });
      } else if (programPointId) {
        // Fetch comments for program point - handle profile data separately
        query = supabase
          .from(TABLES.PROGRAM_COMMENTS)
          .select('*')
          .eq('program_point_id', programPointId)
          .order('created_at', { ascending: false });
      } else if (programItemId && !programPointId) {
        // Fetch comments for program item (section) - handle profile data separately
        query = supabase
          .from(TABLES.PROGRAM_COMMENTS)
          .select('*')
          .eq('program_item_id', programItemId)
          .is('program_point_id', null)
          .order('created_at', { ascending: false });
      }

      // If user is not a moderator, only show approved comments
      if (!isModerator) {
        query = query.eq('status', 'approved');
      } else if (view === 'pending') {
        query = query.eq('status', 'pending');
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data && (programPointId || (programItemId && !programPointId))) {
        // For program comments, fetch user profiles separately
        const commentData = await Promise.all(
          data.map(async (comment: any) => {
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', comment.user_id)
              .single();

            if (userError && userError.code !== 'PGRST116') {
              console.error('Error fetching user profile:', userError);
            }

            return {
              ...comment,
              profiles: userData || null
            };
          })
        );
        
        setComments(commentData as Comment[]);
      } else if (data) {
        // For news comments, profiles are already joined in the initial query
        setComments(data.map((comment: any) => ({
          ...comment,
          profiles: comment.profiles
        })) as Comment[]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (commentId: string, status: 'approved' | 'rejected') => {
    try {
      const table = sourceType === 'news' ? 'comments' : TABLES.PROGRAM_COMMENTS;
      
      const { error } = await supabase
        .from(table)
        .update({ status })
        .eq('id', commentId);

      if (error) {
        throw error;
      }

      // Update local state
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId ? { ...comment, status } : comment
        )
      );
    } catch (error) {
      console.error('Error updating comment status:', error);
    }
  };

  const handleCommentAdded = (newComment: Comment) => {
    if (view === 'pending' && newComment.status !== 'pending') {
      return;
    }
    
    setComments(prevComments => [newComment, ...prevComments]);
  };

  return (
    <div className="comments-section">
      <h3 className="text-2xl font-bold mb-6">Commentaires</h3>

      {user && (
        <>
          <CommentForm 
            newsId={newsId} 
            programItemId={programItemId} 
            programPointId={programPointId}
            onCommentAdded={handleCommentAdded} 
            resourceType={sourceType}
          />
          <Separator className="my-6" />
        </>
      )}

      {isModerator ? (
        <ModeratorView
          comments={comments}
          showAllComments={view === 'all'}
          setShowAllComments={(show) => setView(show ? 'all' : 'pending')}
          onModerateComment={handleStatusChange}
          loading={loading}
          sourceType={sourceType}
        />
      ) : (
        <UserView comments={comments} loading={loading} />
      )}
    </div>
  );
};

export default Comments;

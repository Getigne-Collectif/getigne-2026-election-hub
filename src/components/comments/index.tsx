import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase, TABLES } from '@/integrations/supabase/client';
import CommentForm from './CommentForm';
import { Separator } from '@/components/ui/separator';
import ModeratorView from './ModeratorView';
import UserView from './UserView';
import { Comment, ResourceType } from '@/types/comments.types';

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

  const getSourceType = (): ResourceType => {
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

      if (newsId) {
        // Fetch comments for news
        const { data, error } = await supabase
          .from('comments')
          .select('*, profiles(*)')
          .eq('news_id', newsId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter based on status if needed
        const filteredData = !isModerator 
          ? data.filter((comment: any) => comment.status === 'approved')
          : view === 'pending' 
            ? data.filter((comment: any) => comment.status === 'pending') 
            : data;

        setComments(filteredData.map((comment: any) => ({
          ...comment,
          profiles: comment.profiles
        })) as Comment[]);
      } else if (programItemId) {
        // Fetch comments for program items or points
        let query = supabase
          .from(TABLES.PROGRAM_COMMENTS)
          .select('*')
          .order('created_at', { ascending: false });

        if (programPointId) {
          query = query.eq('program_point_id', programPointId);
        } else {
          query = query.eq('program_item_id', programItemId).is('program_point_id', null);
        }

        // Apply status filter
        if (!isModerator) {
          query = query.eq('status', 'approved');
        } else if (view === 'pending') {
          query = query.eq('status', 'pending');
        }

        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.length === 0) {
          setComments([]);
          setLoading(false);
          return;
        }

        // Manuellement récupérer les profils pour éviter les problèmes de type
        const profileResults = await Promise.all(
          data.map(comment => 
            supabase
              .from('profiles')
              .select('*')
              .eq('id', comment.user_id)
              .single()
          )
        );
        
        // Combiner les commentaires avec les profils
        const commentsWithProfiles = data.map((comment, index) => {
          const profileResult = profileResults[index];
          return {
            ...comment,
            profiles: profileResult.error ? null : profileResult.data
          };
        });
        
        setComments(commentsWithProfiles as Comment[]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
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

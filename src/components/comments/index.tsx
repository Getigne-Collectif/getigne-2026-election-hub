import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth';
import UserView from './UserView';
import ModeratorView from './ModeratorView';
import { supabase, TABLES } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Comment, CommentStatus, ResourceType } from '@/types/comments.types';
import CommentForm from './CommentForm';

interface CommentsProps {
  newsId?: string;
  programItemId?: string;
  programPointId?: string;
}

const Comments: React.FC<CommentsProps> = ({ newsId, programItemId, programPointId }) => {
  const { user, isAdmin, isModerator } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [showAllComments, setShowAllComments] = useState(false);

  // Determine which resource type we're dealing with
  const resourceType: ResourceType = newsId ? 'news' : 'program';
  const resourceId = newsId || programItemId || '';

  const fetchComments = async () => {
    setLoading(true);
    console.log('Fetching comments for resourceType:', resourceType, 'resourceId:', resourceId);
    
    try {
      if (resourceType === 'news') {
        console.log('Fetching news comments for newsId:', newsId);
        // Modification importante: ne pas utiliser la relation directe, mais plutôt deux requêtes séparées
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .eq('news_id', resourceId)
          .order('created_at', { ascending: false });

        if (commentsError) {
          console.error('Error fetching comments:', commentsError);
          throw commentsError;
        }

        console.log('Comments data fetched:', commentsData);

        // Maintenant, récupérons les profils utilisateur séparément
        const commentWithProfiles = await Promise.all(
          commentsData.map(async (comment) => {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, avatar_url')
                .eq('id', comment.user_id)
                .single();

              if (profileError) {
                console.warn('Error fetching profile for user_id:', comment.user_id, profileError);
                return {
                  ...comment,
                  status: comment.status as CommentStatus,
                  profiles: {
                    id: comment.user_id,
                    first_name: 'Utilisateur',
                    last_name: ''
                  }
                } as Comment;
              }

              return {
                ...comment,
                status: comment.status as CommentStatus,
                profiles: profileData
              } as Comment;
            } catch (err) {
              console.error('Error processing comment:', err);
              return {
                ...comment,
                status: comment.status as CommentStatus,
                profiles: {
                  id: comment.user_id,
                  first_name: 'Utilisateur',
                  last_name: ''
                }
              } as Comment;
            }
          })
        );

        console.log('Comments with profiles:', commentWithProfiles);
        setComments(commentWithProfiles);
      } else {
        // For program comments, we need to use a different approach
        console.log('Fetching program comments for programItemId:', programItemId);
        const { data, error } = await supabase
          .from('program_comments')
          .select('*')
          .eq('program_item_id', resourceId);

        if (error) {
          console.error('Error fetching program comments:', error);
          throw error;
        }

        console.log('Program comments data fetched:', data);

        // If this is for a program point, filter by program_point_id
        let filteredData = data;
        if (programPointId) {
          console.log('Filtering by program_point_id:', programPointId);
          filteredData = data.filter(comment => comment.program_point_id === programPointId);
        } else {
          // If not for a specific point, only get comments without a point id
          filteredData = data.filter(comment => comment.program_point_id === null);
        }

        // Now fetch the profile information for each comment
        const commentsWithProfiles = await Promise.all(
          filteredData.map(async (comment) => {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, avatar_url')
                .eq('id', comment.user_id)
                .single();

              if (profileError) {
                console.warn('Error fetching profile for program comment user_id:', comment.user_id, profileError);
                return {
                  ...comment,
                  status: comment.status as CommentStatus,
                  profiles: {
                    id: comment.user_id,
                    first_name: 'Utilisateur',
                    last_name: ''
                  }
                } as Comment;
              }

              return {
                ...comment,
                status: comment.status as CommentStatus,
                profiles: profileData
              } as Comment;
            } catch (err) {
              console.error('Error processing program comment:', err);
              return {
                ...comment,
                status: comment.status as CommentStatus,
                profiles: {
                  id: comment.user_id,
                  first_name: 'Utilisateur',
                  last_name: ''
                }
              } as Comment;
            }
          })
        );

        console.log('Program comments with profiles:', commentsWithProfiles);
        setComments(commentsWithProfiles);
      }
    } catch (err: any) {
      console.error('Error in fetchComments:', err);
      setError(err.message || 'Error fetching comments');
      toast({
        title: 'Error',
        description: 'Failed to load comments. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [resourceId, resourceType, programPointId]);

  const handleAddComment = (newComment: Comment) => {
    setComments([newComment, ...comments]);
  };

  const handleModerateComment = async (commentId: string, status: CommentStatus) => {
    try {
      const table = resourceType === 'news' ? 'comments' : 'program_comments';
      console.log('Moderating comment:', commentId, 'with status:', status, 'in table:', table);
      
      const { error } = await supabase
        .from(table)
        .update({ status })
        .eq('id', commentId);

      if (error) {
        console.error('Error updating comment status:', error);
        throw error;
      }

      setComments(
        comments.map((comment) =>
          comment.id === commentId ? { ...comment, status } : comment
        )
      );

      toast({
        title: 'Comment updated',
        description: `Comment has been ${status}.`,
      });
    } catch (err: any) {
      console.error('Error in handleModerateComment:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update the comment',
        variant: 'destructive',
      });
    }
  };

  const approvedComments = comments.filter((c) => c.status === 'approved');
  const pendingComments = comments.filter((c) => c.status === 'pending');

  return (
    <div className="space-y-8">
      {(isAdmin || isModerator) && pendingComments.length > 0 && (
        <div className="space-y-6">
          <ModeratorView
            comments={showAllComments ? comments : pendingComments}
            showAllComments={showAllComments}
            setShowAllComments={setShowAllComments}
            onModerateComment={handleModerateComment}
            loading={loading}
            sourceType={resourceType}
          />
        </div>
      )}
      
      {approvedComments.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Commentaires</h3>
          <UserView
          comments={approvedComments}
          loading={loading}
          />
        </div>
      )}

      {user && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Ajouter un commentaire</h3>
          <CommentForm
            newsId={newsId}
            programItemId={programItemId}
            programPointId={programPointId}
            onCommentAdded={handleAddComment}
            resourceType={resourceType}
          />
        </div>
      ) || (
        <div>
          Vous devez être connecté pour ajouter un commentaire
        </div>
      )}
    </div>
  );
};

export default Comments;

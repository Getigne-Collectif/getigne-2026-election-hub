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

  // Helper function to organize comments into a tree structure
  const organizeComments = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create a map of all comments
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into tree
    comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          if (!parent.replies) {
            parent.replies = [];
          }
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    // Sort root comments by created_at (newest first)
    rootComments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Sort replies by created_at (oldest first)
    const sortReplies = (comment: Comment) => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        comment.replies.forEach(sortReplies);
      }
    };
    rootComments.forEach(sortReplies);

    return rootComments;
  };

  const fetchComments = async () => {
    setLoading(true);
    
    try {
      if (resourceType === 'news') {
        // Fetch all comments (including replies)
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .eq('news_id', resourceId)
          .order('created_at', { ascending: false });

        if (commentsError) {
          console.error('Error fetching comments:', commentsError);
          throw commentsError;
        }

        // Fetch likes count for all comments
        const { data: likesData, error: likesError } = await supabase
          .from('comment_likes')
          .select('comment_id, user_id')
          .in('comment_id', commentsData.map(c => c.id));

        if (likesError) {
          console.warn('Error fetching likes:', likesError);
        }

        // Create a map of likes count and check if current user liked
        const likesMap = new Map<string, { count: number; isLiked: boolean }>();
        commentsData.forEach((comment) => {
          const commentLikes = likesData?.filter(l => l.comment_id === comment.id) || [];
          likesMap.set(comment.id, {
            count: commentLikes.length,
            isLiked: user ? commentLikes.some(l => l.user_id === user.id) : false,
          });
        });

        // Fetch profiles and add likes info
        const commentWithProfiles = await Promise.all(
          commentsData.map(async (comment) => {
            try {
              // Si user_id est null, c'est un utilisateur supprimé
              if (!comment.user_id) {
                const likesInfo = likesMap.get(comment.id) || { count: 0, isLiked: false };
                return {
                  ...comment,
                  status: comment.status as CommentStatus,
                  profiles: null,
                  likes_count: likesInfo.count,
                  is_liked: false, // Un utilisateur supprimé ne peut pas avoir liké
                } as Comment;
              }

              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, avatar_url')
                .eq('id', comment.user_id)
                .single();

              const likesInfo = likesMap.get(comment.id) || { count: 0, isLiked: false };

              if (profileError) {
                console.warn('Error fetching profile for user_id:', comment.user_id, profileError);
                return {
                  ...comment,
                  status: comment.status as CommentStatus,
                  profiles: {
                    id: comment.user_id,
                    first_name: 'Utilisateur',
                    last_name: ''
                  },
                  likes_count: likesInfo.count,
                  is_liked: likesInfo.isLiked,
                } as Comment;
              }

              return {
                ...comment,
                status: comment.status as CommentStatus,
                profiles: profileData,
                likes_count: likesInfo.count,
                is_liked: likesInfo.isLiked,
              } as Comment;
            } catch (err) {
              console.error('Error processing comment:', err);
              const likesInfo = likesMap.get(comment.id) || { count: 0, isLiked: false };
              return {
                ...comment,
                status: comment.status as CommentStatus,
                profiles: comment.user_id ? {
                  id: comment.user_id,
                  first_name: 'Utilisateur',
                  last_name: ''
                } : null,
                likes_count: likesInfo.count,
                is_liked: comment.user_id ? likesInfo.isLiked : false,
              } as Comment;
            }
          })
        );

        // Organize comments into tree structure
        const organizedComments = organizeComments(commentWithProfiles);
        setComments(organizedComments);
      } else {
        // For program comments
        const { data, error } = await supabase
          .from('program_comments')
          .select('*')
          .eq('program_item_id', resourceId);

        if (error) {
          console.error('Error fetching program comments:', error);
          throw error;
        }

        // If this is for a program point, filter by program_point_id
        let filteredData = data;
        if (programPointId) {
          filteredData = data.filter(comment => comment.program_point_id === programPointId);
        } else {
          // If not for a specific point, only get comments without a point id
          filteredData = data.filter(comment => comment.program_point_id === null);
        }

        // Fetch likes count for all comments
        const { data: likesData, error: likesError } = await supabase
          .from('program_comment_likes')
          .select('comment_id, user_id')
          .in('comment_id', filteredData.map(c => c.id));

        if (likesError) {
          console.warn('Error fetching program comment likes:', likesError);
        }

        // Create a map of likes count and check if current user liked
        const likesMap = new Map<string, { count: number; isLiked: boolean }>();
        filteredData.forEach((comment) => {
          const commentLikes = likesData?.filter(l => l.comment_id === comment.id) || [];
          likesMap.set(comment.id, {
            count: commentLikes.length,
            isLiked: user ? commentLikes.some(l => l.user_id === user.id) : false,
          });
        });

        // Fetch profiles and add likes info
        const commentsWithProfiles = await Promise.all(
          filteredData.map(async (comment) => {
            try {
              // Si user_id est null, c'est un utilisateur supprimé
              if (!comment.user_id) {
                const likesInfo = likesMap.get(comment.id) || { count: 0, isLiked: false };
                return {
                  ...comment,
                  status: comment.status as CommentStatus,
                  profiles: null,
                  likes_count: likesInfo.count,
                  is_liked: false, // Un utilisateur supprimé ne peut pas avoir liké
                } as Comment;
              }

              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, avatar_url')
                .eq('id', comment.user_id)
                .single();

              const likesInfo = likesMap.get(comment.id) || { count: 0, isLiked: false };

              if (profileError) {
                console.warn('Error fetching profile for program comment user_id:', comment.user_id, profileError);
                return {
                  ...comment,
                  status: comment.status as CommentStatus,
                  profiles: {
                    id: comment.user_id,
                    first_name: 'Utilisateur',
                    last_name: ''
                  },
                  likes_count: likesInfo.count,
                  is_liked: likesInfo.isLiked,
                } as Comment;
              }

              return {
                ...comment,
                status: comment.status as CommentStatus,
                profiles: profileData,
                likes_count: likesInfo.count,
                is_liked: likesInfo.isLiked,
              } as Comment;
            } catch (err) {
              console.error('Error processing program comment:', err);
              const likesInfo = likesMap.get(comment.id) || { count: 0, isLiked: false };
              return {
                ...comment,
                status: comment.status as CommentStatus,
                profiles: comment.user_id ? {
                  id: comment.user_id,
                  first_name: 'Utilisateur',
                  last_name: ''
                } : null,
                likes_count: likesInfo.count,
                is_liked: comment.user_id ? likesInfo.isLiked : false,
              } as Comment;
            }
          })
        );

        // Organize comments into tree structure
        const organizedComments = organizeComments(commentsWithProfiles);
        setComments(organizedComments);
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
    // If it's a reply, we need to refresh to get the tree structure
    if (newComment.parent_comment_id) {
      fetchComments();
    } else {
      // If it's a root comment, add it to the beginning
      setComments([newComment, ...comments]);
    }
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    // Helper function to update a comment in the tree
    const updateCommentInTree = (comments: Comment[]): Comment[] => {
      return comments.map((comment) => {
        if (comment.id === updatedComment.id) {
          return { ...comment, ...updatedComment };
        }
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateCommentInTree(comment.replies),
          };
        }
        return comment;
      });
    };

    setComments(updateCommentInTree(comments));
  };

  const handleCommentDeleted = (commentId: string) => {
    // Helper function to remove or mark a comment as deleted in the tree
    const deleteCommentInTree = (comments: Comment[]): Comment[] => {
      return comments
        .map((comment) => {
          if (comment.id === commentId) {
            // Si le commentaire a des réponses, on le marque comme deleted
            // Sinon, on le retire complètement (retourne null pour le filtrer)
            if (comment.replies && comment.replies.length > 0) {
              return { ...comment, status: 'deleted' as CommentStatus };
            }
            return null; // Retirer complètement si pas de réponses
          }
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: deleteCommentInTree(comment.replies),
            };
          }
          return comment;
        })
        .filter((comment): comment is Comment => comment !== null);
    };

    setComments(deleteCommentInTree(comments));
  };

  const handleModerateComment = async (commentId: string, status: CommentStatus) => {
    try {
      const table = resourceType === 'news' ? 'comments' : 'program_comments';
      
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

  // Inclure les commentaires approuvés et supprimés (pour garder la structure)
  const approvedComments = comments.filter((c) => c.status === 'approved' || c.status === 'deleted');
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
          <UserView
            comments={approvedComments}
            loading={loading}
            resourceType={resourceType}
            newsId={newsId}
            programItemId={programItemId}
            programPointId={programPointId}
            onCommentAdded={handleAddComment}
            onCommentUpdated={handleCommentUpdated}
            onCommentDeleted={handleCommentDeleted}
          />
        </div>
      )}

      {user && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Ajoutez un commentaire</h3>
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

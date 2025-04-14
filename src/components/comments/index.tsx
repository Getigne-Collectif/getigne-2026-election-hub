
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth';
import UserView from './UserView';
import ModeratorView from './ModeratorView';
import { supabase, TABLES } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Comment, CommentStatus, ResourceType } from '@/types/comments.types';

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
    
    try {
      let query;
      
      if (resourceType === 'news') {
        query = supabase
          .from('comments')
          .select(`
            *,
            profiles:user_id (
              id,
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('news_id', resourceId);
      } else {
        // For program comments, we need to use a different approach
        const { data, error } = await supabase
          .from('program_comments')
          .select('*')
          .eq('program_item_id', resourceId);

        if (error) throw error;

        // If this is for a program point, filter by program_point_id
        let filteredData = data;
        if (programPointId) {
          filteredData = data.filter(comment => comment.program_point_id === programPointId);
        } else {
          // If not for a specific point, only get comments without a point id
          filteredData = data.filter(comment => comment.program_point_id === null);
        }

        // Now fetch the profile information for each comment
        const commentsWithProfiles = await Promise.all(
          filteredData.map(async (comment) => {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, avatar_url')
              .eq('id', comment.user_id)
              .single();

            if (profileError) {
              console.error('Error fetching profile:', profileError);
              // Return comment with a placeholder profile
              return {
                ...comment,
                status: comment.status as CommentStatus, // Cast the status to the correct type
                profiles: {
                  id: comment.user_id,
                  first_name: 'Utilisateur',
                  last_name: ''
                }
              } as Comment; // Cast the entire object to Comment type
            }

            // Return comment with fetched profile
            return {
              ...comment,
              status: comment.status as CommentStatus, // Cast the status to the correct type
              profiles: profileData
            } as Comment; // Cast the entire object to Comment type
          })
        );

        setComments(commentsWithProfiles);
        setLoading(false);
        return; // Exit early as we've already set the comments
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Validate that the data format matches what we expect
      const validComments = data.map(comment => {
        // Handle the case where profiles is null or has an error
        if (!comment.profiles || 'error' in comment.profiles) {
          // Create a placeholder profile
          const placeholderProfile = {
            id: comment.user_id,
            first_name: 'Utilisateur',
            last_name: ''
          };
          
          return {
            ...comment,
            status: comment.status as CommentStatus, // Cast the status to the correct type
            profiles: placeholderProfile
          } as Comment; // Cast the entire object to Comment type
        }
        
        return {
          ...comment,
          status: comment.status as CommentStatus // Cast the status to the correct type
        } as Comment; // Cast the entire object to Comment type
      });

      setComments(validComments);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
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
      
      const { error } = await supabase
        .from(table)
        .update({ status })
        .eq('id', commentId);

      if (error) throw error;

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
      console.error('Error updating comment:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update the comment',
        variant: 'destructive',
      });
    }
  };

  if (isAdmin || isModerator) {
    return (
      <div className="space-y-6">
        <ModeratorView
          comments={showAllComments ? comments : comments.filter(c => c.status === 'pending')}
          showAllComments={showAllComments}
          setShowAllComments={setShowAllComments}
          onModerateComment={handleModerateComment}
          loading={loading}
          sourceType={resourceType}
        />
      </div>
    );
  }

  const approvedComments = comments.filter((c) => c.status === 'approved');

  return (
    <UserView
      comments={approvedComments}
      loading={loading}
    />
  );
};

export default Comments;

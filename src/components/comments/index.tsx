
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
        query = supabase
          .from('program_comments')
          .select(`
            *,
            profiles:user_id (
              id,
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('program_item_id', resourceId);

        // If this is for a program point, add the point filter
        if (programPointId) {
          query = query.eq('program_point_id', programPointId);
        }
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
            profiles: placeholderProfile
          } as Comment;
        }
        
        return comment as Comment;
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

  const handleAddComment = async (content: string) => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'You must be logged in to post a comment',
        variant: 'destructive',
      });
      return;
    }

    try {
      let newComment: any;
      
      if (resourceType === 'news' && newsId) {
        // Add comment to news
        const { data, error } = await supabase
          .from('comments')
          .insert({
            news_id: newsId,
            user_id: user.id,
            content,
            status: 'pending' as CommentStatus
          })
          .select('*')
          .single();

        if (error) throw error;
        newComment = data;
      } else if (programItemId) {
        // Add comment to program
        const commentData: any = {
          program_item_id: programItemId,
          user_id: user.id,
          content,
          status: 'pending' as CommentStatus
        };

        // Add the program_point_id if applicable
        if (programPointId) {
          commentData.program_point_id = programPointId;
        }

        const { data, error } = await supabase
          .from('program_comments')
          .insert(commentData)
          .select('*')
          .single();

        if (error) throw error;
        newComment = data;
      }

      // Add user profile information to the new comment
      // This is needed to match our Comment type format
      const userProfile = {
        id: user.id,
        first_name: user.user_metadata?.first_name || 'Utilisateur',
        last_name: user.user_metadata?.last_name || '',
      };

      const commentWithProfile = {
        ...newComment,
        profiles: userProfile,
      } as Comment;

      setComments([commentWithProfile, ...comments]);

      toast({
        title: 'Comment submitted',
        description: 'Your comment has been submitted for moderation.',
      });
    } catch (err: any) {
      console.error('Error adding comment:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to add your comment',
        variant: 'destructive',
      });
    }
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

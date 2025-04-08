
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth';
import UserView from './UserView';
import ModeratorView from './ModeratorView';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Comment, CommentStatus, CommentType, Profile } from '@/types/comments.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CommentsProps {
  entityId: string;
  type: CommentType;
  pointId?: string;
}

const Comments: React.FC<CommentsProps> = ({ entityId, type, pointId }) => {
  const { user, isAdmin, isModerator } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchComments = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from(`${type}_comments`)
        .select(`
          *,
          profiles:user_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq(`${type}_item_id`, entityId);

      // If this is for a program point, add the point filter
      if (type === 'program' && pointId) {
        query = query.eq('program_point_id', pointId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Validate that the data format matches what we expect
      const validComments = data.map(comment => {
        // Handle the case where profiles is null or has an error
        if (!comment.profiles || 'error' in comment.profiles) {
          // Create a placeholder profile
          const placeholderProfile: Profile = {
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
  }, [entityId, type, pointId]);

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
      const newComment = {
        [`${type}_item_id`]: entityId,
        user_id: user.id,
        content,
        status: 'pending' as CommentStatus,
      };

      // Add the program_point_id if applicable
      if (type === 'program' && pointId) {
        Object.assign(newComment, { program_point_id: pointId });
      }

      const { data, error } = await supabase
        .from(`${type}_comments`)
        .insert(newComment)
        .select('*')
        .single();

      if (error) throw error;

      // Add the user profile to match our Comment type format
      const commentWithProfile = {
        ...data,
        profiles: {
          id: user.id,
          first_name: user.first_name || 'Utilisateur',
          last_name: user.last_name || '',
        },
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

  const updateComment = async (commentId: string, status: CommentStatus) => {
    try {
      const { error } = await supabase
        .from(`${type}_comments`)
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
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ModeratorView
              comments={comments}
              loading={loading}
              error={error}
              onUpdateComment={updateComment}
              onAddComment={handleAddComment}
            />
          </TabsContent>

          <TabsContent value="pending">
            <ModeratorView
              comments={comments.filter((c) => c.status === 'pending')}
              loading={loading}
              error={error}
              onUpdateComment={updateComment}
              onAddComment={handleAddComment}
            />
          </TabsContent>

          <TabsContent value="approved">
            <ModeratorView
              comments={comments.filter((c) => c.status === 'approved')}
              loading={loading}
              error={error}
              onUpdateComment={updateComment}
              onAddComment={handleAddComment}
            />
          </TabsContent>

          <TabsContent value="rejected">
            <ModeratorView
              comments={comments.filter((c) => c.status === 'rejected')}
              loading={loading}
              error={error}
              onUpdateComment={updateComment}
              onAddComment={handleAddComment}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  const approvedComments = comments.filter((c) => c.status === 'approved');

  return (
    <UserView
      comments={approvedComments}
      loading={loading}
      error={error}
      onAddComment={handleAddComment}
      isAuthenticated={!!user}
    />
  );
};

export default Comments;

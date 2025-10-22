import React, { useState } from 'react';
import { useAuth } from '@/context/auth';
import { supabase, TABLES } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { ResourceType, Comment, CommentStatus } from '@/types/comments.types';
import { usePostHog } from '@/hooks/usePostHog';

interface CommentFormProps {
  newsId?: string;
  programItemId?: string;
  programPointId?: string;
  onCommentAdded: (comment: Comment) => void;
  resourceType: ResourceType;
}

const CommentForm: React.FC<CommentFormProps> = ({ 
  newsId, 
  programItemId,
  programPointId,
  onCommentAdded,
  resourceType
}) => {
  const { user, isAdmin, userRoles } = useAuth();
  const [content, setContent] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { toast } = useToast();
  const { capture } = usePostHog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour commenter.",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Erreur",
        description: "Le commentaire ne peut pas être vide.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Déterminer si l'utilisateur est modérateur ou admin
      const isModerator = isAdmin || userRoles.includes('moderator');
      // Statut initial du commentaire (approuvé automatiquement pour les modérateurs/admins)
      const initialStatus: CommentStatus = isModerator ? 'approved' : 'pending';

      if (resourceType === 'news') {
        
        // Insert into comments table for news
        const { data: commentData, error: commentError } = await supabase
          .from('comments')
          .insert([
            {
              user_id: user.id,
              news_id: newsId,
              content,
              status: initialStatus,
            },
          ])
          .select()
          .single();

        if (commentError) {
          console.error('Error inserting comment:', commentError);
          throw commentError;
        }

        
        // Fetch the user profile separately
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.warn('Error fetching profile:', profileError);
        }

        const profile = profileError ? {
          id: user.id,
          first_name: user.user_metadata?.first_name || 'Utilisateur',
          last_name: user.user_metadata?.last_name || '',
        } : profileData;

        const newComment = {
          ...commentData,
          status: commentData.status as CommentStatus,
          profiles: profile
        } as Comment;

        onCommentAdded(newComment);
        
        // Track article comment in PostHog
        capture('article_comment', {
          comment_id: commentData.id,
          news_id: newsId,
          user_id: user.id,
          comment_length: content.length,
          is_moderator: isModerator,
          status: initialStatus,
          resource_type: 'news'
        });
      } else {
        
        // Insert into program_comments table for program items or points
        const commentData: any = {
          user_id: user.id,
          program_item_id: programItemId,
          content,
          status: initialStatus,
        };

        // Add the program_point_id if applicable
        if (programPointId) {
          commentData.program_point_id = programPointId;
        }

        const { data: insertedComment, error: commentError } = await supabase
          .from(TABLES.PROGRAM_COMMENTS)
          .insert([commentData])
          .select()
          .single();

        if (commentError) {
          console.error('Error inserting program comment:', commentError);
          throw commentError;
        }
        
        
        // Get user profile data separately
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.warn('Error fetching profile for program comment:', profileError);
        }

        const profile = profileError ? {
          id: user.id,
          first_name: user.user_metadata?.first_name || 'Utilisateur',
          last_name: user.user_metadata?.last_name || '',
        } : profileData;
        
        const newComment = {
          ...insertedComment,
          status: insertedComment.status as CommentStatus,
          profiles: profile
        } as Comment;

        onCommentAdded(newComment);
        
        // Track program comment in PostHog
        capture('program_comment', {
          comment_id: insertedComment.id,
          program_item_id: programItemId,
          program_point_id: programPointId,
          user_id: user.id,
          comment_length: content.length,
          is_moderator: isModerator,
          status: initialStatus,
          resource_type: 'program'
        });
      }

      setContent('');

      if (initialStatus === 'pending') {
        toast({
          title: "Commentaire envoyé",
          description: "Votre commentaire sera visible après modération.",
        });
      } else {
        toast({
          title: "Commentaire publié",
          description: "Votre commentaire a été publié avec succès.",
        });
      }
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du commentaire.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Textarea
          placeholder="Qu'est-ce que cela vous inspire... ajoutez un commentaire"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full p-3 border rounded-md focus:ring-getigne-accent focus:border-getigne-accent"
        />
      </div>
      <div>
        <Button 
          type="submit" 
          disabled={submitting}
          className="bg-getigne-accent hover:bg-getigne-accent/90"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            "Publier un commentaire"
          )}
        </Button>
      </div>
    </form>
  );
};

export default CommentForm;

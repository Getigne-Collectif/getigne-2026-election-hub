
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { ResourceType, Comment } from '@/types/comments.types';

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
      const initialStatus = isModerator ? 'approved' : 'pending';

      let newComment: any;

      if (resourceType === 'news') {
        // Insert into comments table for news
        const { data, error } = await supabase
          .from('comments')
          .insert([
            {
              user_id: user.id,
              news_id: newsId,
              content,
              status: initialStatus,
            },
          ])
          .select('*, profiles(*)')
          .single();

        if (error) throw error;
        newComment = data;
      } else {
        // Insert into program_comments table for program items or points
        const commentData: any = {
          user_id: user.id,
          content,
          status: initialStatus,
        };

        // Add the appropriate ID based on the resource type
        if (programPointId) {
          commentData.program_point_id = programPointId;
          commentData.program_item_id = programItemId; // Always include the parent item
        } else if (programItemId) {
          commentData.program_item_id = programItemId;
        }

        const { data: commentData2, error } = await supabase
          .from('program_comments')
          .insert([commentData])
          .select()
          .single();

        if (error) throw error;
        
        // Get user profile data separately
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        newComment = {
          ...commentData2,
          profiles: profileData || null
        };
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

      // Call the callback with the new comment
      onCommentAdded(newComment);
    } catch (error) {
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
          placeholder="Partagez votre avis..."
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

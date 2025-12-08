import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Comment, ResourceType } from '@/types/comments.types';

interface EditCommentDialogProps {
  comment: Comment;
  resourceType: ResourceType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentUpdated: (updatedComment: Comment) => void;
}

const EditCommentDialog: React.FC<EditCommentDialogProps> = ({
  comment,
  resourceType,
  open,
  onOpenChange,
  onCommentUpdated,
}) => {
  const [content, setContent] = useState(comment.content);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const table = resourceType === 'news' ? 'comments' : 'program_comments';

      const { data, error } = await supabase
        .from(table)
        .update({
          content,
          edited_at: new Date().toISOString(),
        })
        .eq('id', comment.id)
        .select()
        .single();

      if (error) throw error;

      const updatedComment = {
        ...comment,
        ...data,
        content: data.content,
        edited_at: data.edited_at,
      } as Comment;

      onCommentUpdated(updatedComment);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le commentaire</DialogTitle>
          <DialogDescription>
            Modifiez le contenu de votre commentaire.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full"
              placeholder="Votre commentaire..."
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting || !content.trim()}
              className="bg-getigne-accent hover:bg-getigne-accent/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCommentDialog;


import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from './utils';
import { Comment, ResourceType } from '@/types/comments.types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import CommentLikeButton from './CommentLikeButton';
import CommentForm from './CommentForm';
import EditCommentDialog from './EditCommentDialog';
import { useAuth } from '@/context/auth';
import { MessageSquare, Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CommentItemProps {
  comment: Comment;
  resourceType: ResourceType;
  newsId?: string;
  programItemId?: string;
  programPointId?: string;
  flagshipProjectId?: string;
  onCommentAdded: (comment: Comment) => void;
  onCommentUpdated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
  depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  resourceType,
  newsId,
  programItemId,
  programPointId,
  flagshipProjectId,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  depth = 0,
}) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const maxDepth = 3; // Limite la profondeur des réponses

  const isOwner = user?.id === comment.user_id;
  const canEditOrDelete = (isOwner || isAdmin) && comment.user_id !== null; // Ne pas permettre l'édition si user_id est null
  const isDeleted = comment.status === 'deleted';

  const handleReplyAdded = (newReply: Comment) => {
    onCommentAdded(newReply);
    setShowReplyForm(false);
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    if (onCommentUpdated) {
      onCommentUpdated(updatedComment);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const table = resourceType === 'news' ? 'comments' : 'program_comments';
      const hasReplies = comment.replies && comment.replies.length > 0;
      
      if (hasReplies) {
        // Si le commentaire a des réponses, on fait un soft delete
        const { error } = await supabase
          .from(table)
          .update({ status: 'deleted' })
          .eq('id', comment.id);

        if (error) throw error;

        if (onCommentDeleted) {
          onCommentDeleted(comment.id);
        }

        toast({
          title: 'Commentaire supprimé',
          description: 'Le commentaire a été marqué comme supprimé. Les réponses restent visibles.',
        });
      } else {
        // Si le commentaire n'a pas de réponses, on fait un hard delete
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', comment.id);

        if (error) throw error;

        if (onCommentDeleted) {
          onCommentDeleted(comment.id);
        }

        toast({
          title: 'Commentaire supprimé',
          description: 'Le commentaire a été définitivement supprimé.',
        });
      }

      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue lors de la suppression.",
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 mt-3 border-l-2 border-getigne-100 pl-4' : ''}`}>
      <div className="flex gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
        <Avatar className="h-8 w-8 bg-getigne-100 flex-shrink-0">
          {comment.profiles?.avatar_url ? (
            <AvatarImage src={comment.profiles.avatar_url} alt="Avatar utilisateur" />
          ) : null}
          <AvatarFallback className="text-getigne-700 text-xs">
            {!comment.user_id 
              ? 'US'
              : comment.profiles 
                ? getInitials(comment.profiles.first_name, comment.profiles.last_name) 
                : 'UN'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {!comment.user_id 
                ? 'Utilisateur supprimé'
                : comment.profiles && comment.profiles.first_name && comment.profiles.last_name
                  ? `${comment.profiles.first_name} ${comment.profiles.last_name}`
                  : 'Utilisateur anonyme'}
            </span>
            <span className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
            </span>
            {comment.edited_at && (
              <span className="text-muted-foreground text-xs font-bold">
                modifié
              </span>
            )}
            {canEditOrDelete && !isDeleted && (
              <div className="flex gap-1 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditDialog(true)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" />
                  <span className="sr-only">Modifier</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                >
                  <Trash className="h-3 w-3" />
                  <span className="sr-only">Supprimer</span>
                </Button>
              </div>
            )}
          </div>
          {isDeleted ? (
            <p className="text-sm text-muted-foreground italic mb-2">Message supprimé</p>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap mb-2">{comment.content}</p>
          )}
          
          {!isDeleted && (
            <div className="flex items-center gap-3 mt-2">
              <CommentLikeButton
                commentId={comment.id}
                resourceType={resourceType}
                initialLikesCount={comment.likes_count || 0}
                initialIsLiked={comment.is_liked || false}
              />
              {user && depth < maxDepth && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-muted-foreground hover:text-foreground h-7"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">Répondre</span>
                </Button>
              )}
            </div>
          )}

          {showReplyForm && user && (
            <div className="mt-3">
              <CommentForm
                newsId={newsId}
                programItemId={programItemId}
                programPointId={programPointId}
                flagshipProjectId={flagshipProjectId}
                onCommentAdded={handleReplyAdded}
                resourceType={resourceType}
                parentCommentId={comment.id}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Dialog de modification */}
      <EditCommentDialog
        comment={comment}
        resourceType={resourceType}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onCommentUpdated={handleCommentUpdated}
      />

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le commentaire</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce commentaire ? 
              {comment.replies && comment.replies.length > 0 ? (
                <span className="block mt-2">
                  Ce commentaire a {comment.replies.length} {comment.replies.length === 1 ? 'réponse' : 'réponses'}. 
                  Le commentaire sera marqué comme supprimé mais les réponses resteront visibles.
                </span>
              ) : (
                <span className="block mt-2">
                  Cette action est irréversible. Le commentaire sera définitivement supprimé.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Afficher les réponses de manière récursive */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              resourceType={resourceType}
              newsId={newsId}
              programItemId={programItemId}
              programPointId={programPointId}
              flagshipProjectId={flagshipProjectId}
              onCommentAdded={onCommentAdded}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;


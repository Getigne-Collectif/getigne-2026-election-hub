
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth';
import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'lucide-react';

interface Profile {
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  profiles?: Profile | null;
}

interface CommentDisplayProps {
  comments: Comment[];
  onEditComment?: (comment: Comment) => void;
  onDeleteComment?: (commentId: string) => void;
}

const CommentDisplay: React.FC<CommentDisplayProps> = ({ 
  comments, 
  onEditComment, 
  onDeleteComment 
}) => {
  const { user } = useAuth();
  
  // Helper function to get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'UN';
  };

  // Filtre pour afficher uniquement les commentaires approuvés ou ceux de l'utilisateur connecté
  const visibleComments = comments.filter(comment => 
    comment.status === 'approved' || comment.user_id === user?.id
  );

  if (visibleComments.length === 0) {
    return (
      <div className="text-center py-8 text-brand-500">
        Aucun commentaire pour cet article
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {visibleComments.map((comment) => (
        <div 
          key={comment.id} 
          className={`bg-white p-5 rounded-lg shadow-sm border ${
            comment.status === 'pending' ? 'border-amber-200 bg-amber-50' : 
            comment.status === 'rejected' ? 'border-red-200 bg-red-50' : 
            'border-brand-100'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-10 w-10 bg-brand-100">
              {comment.profiles?.avatar_url ? (
                <AvatarImage src={comment.profiles.avatar_url} alt="Avatar utilisateur" />
              ) : null}
              <AvatarFallback className="text-brand-700">
                {comment.profiles ? getInitials(comment.profiles.first_name, comment.profiles.last_name) : 'UN'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-medium">
                {comment.profiles?.first_name && comment.profiles?.last_name 
                  ? `${comment.profiles.first_name} ${comment.profiles.last_name}` 
                  : 'Utilisateur anonyme'}
                {comment.user_id === user?.id && <span className="ml-2 text-sm text-brand-500">(Vous)</span>}
              </h4>
              <time className="text-brand-500 text-sm">
                {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
            </div>
            
            {/* Actions de modification/suppression si c'est le commentaire de l'utilisateur */}
            {comment.user_id === user?.id && onEditComment && onDeleteComment && (
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onEditComment(comment)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Modifier</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onDeleteComment(comment.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Supprimer</span>
                </Button>
              </div>
            )}
          </div>
          
          <p className="text-brand-700 whitespace-pre-wrap">{comment.content}</p>
          
          {/* Indicateur de statut pour les commentaires de l'utilisateur */}
          {comment.user_id === user?.id && comment.status !== 'approved' && (
            <div className="mt-2 text-sm">
              {comment.status === 'pending' && (
                <span className="text-amber-600">En attente d'approbation</span>
              )}
              {comment.status === 'rejected' && (
                <span className="text-red-600">Rejeté par un modérateur</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CommentDisplay;

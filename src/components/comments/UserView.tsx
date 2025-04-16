import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from './utils';
import { Comment } from '@/types/comments.types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserViewProps {
  comments: Comment[];
  loading?: boolean;
}

const UserView: React.FC<UserViewProps> = ({ comments, loading = false }) => {
  if (loading) {
    return (
      <div className="text-center py-8 text-getigne-500">
        Chargement des commentaires...
      </div>
    );
  }

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div 
          key={comment.id} 
          className="flex gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <Avatar className="h-8 w-8 bg-getigne-100">
            {comment.profiles?.avatar_url ? (
              <AvatarImage src={comment.profiles.avatar_url} alt="Avatar utilisateur" />
            ) : null}
            <AvatarFallback className="text-getigne-700 text-xs">
              {comment.profiles ? getInitials(comment.profiles.first_name, comment.profiles.last_name) : 'UN'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">
                {comment.profiles && comment.profiles.first_name && comment.profiles.last_name
                  ? `${comment.profiles.first_name} ${comment.profiles.last_name}`
                  : 'Utilisateur anonyme'}
              </span>
              <span className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
              </span>
            </div>
            <p className="text-sm text-foreground">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserView;

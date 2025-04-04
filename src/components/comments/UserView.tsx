
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from './utils';
import { Comment } from '@/types/comments.types';

interface UserViewProps {
  comments: Comment[];
}

const UserView: React.FC<UserViewProps> = ({ comments }) => {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-getigne-500">
        Aucun commentaire pour cet article
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div 
          key={comment.id} 
          className="bg-white p-5 rounded-lg shadow-sm border border-getigne-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-10 w-10 bg-getigne-100">
              {comment.profiles?.avatar_url ? (
                <AvatarImage src={comment.profiles.avatar_url} alt="Avatar utilisateur" />
              ) : null}
              <AvatarFallback className="text-getigne-700">
                {comment.profiles ? getInitials(comment.profiles.first_name, comment.profiles.last_name) : 'UN'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">
                {comment.profiles ? `${comment.profiles.first_name} ${comment.profiles.last_name}` : 'Utilisateur'}
              </h4>
              <time className="text-getigne-500 text-sm">
                {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
            </div>
          </div>
          <p className="text-getigne-700">{comment.content}</p>
        </div>
      ))}
    </div>
  );
};

export default UserView;

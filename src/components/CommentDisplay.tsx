
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Profile {
  first_name: string;
  last_name: string;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  profiles?: Profile;
}

interface CommentDisplayProps {
  comments: Comment[];
}

const CommentDisplay: React.FC<CommentDisplayProps> = ({ comments }) => {
  // Helper function to get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'UN';
  };

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

export default CommentDisplay;

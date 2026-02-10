import React from 'react';
import { Comment, ResourceType } from '@/types/comments.types';
import CommentItem from './CommentItem';

interface UserViewProps {
  comments: Comment[];
  loading?: boolean;
  resourceType: ResourceType;
  newsId?: string;
  programItemId?: string;
  programPointId?: string;
  flagshipProjectId?: string;
  onCommentAdded: (comment: Comment) => void;
  onCommentUpdated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
  onMarkAsViewed?: (commentId: string) => void;
}

const UserView: React.FC<UserViewProps> = ({ 
  comments, 
  loading = false,
  resourceType,
  newsId,
  programItemId,
  programPointId,
  flagshipProjectId,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  onMarkAsViewed
}) => {
  if (loading) {
    return (
      <div className="text-center py-8 text-brand-500">
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
        <CommentItem
          key={comment.id}
          comment={comment}
          resourceType={resourceType}
          newsId={newsId}
          programItemId={programItemId}
          programPointId={programPointId}
          flagshipProjectId={flagshipProjectId}
          onCommentAdded={onCommentAdded}
          onCommentUpdated={onCommentUpdated}
          onCommentDeleted={onCommentDeleted}
          onMarkAsViewed={onMarkAsViewed}
        />
      ))}
    </div>
  );
};

export default UserView;

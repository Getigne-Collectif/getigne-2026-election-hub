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
  onCommentAdded: (comment: Comment) => void;
  onCommentUpdated?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
}

const UserView: React.FC<UserViewProps> = ({ 
  comments, 
  loading = false,
  resourceType,
  newsId,
  programItemId,
  programPointId,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted
}) => {
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
        <CommentItem
          key={comment.id}
          comment={comment}
          resourceType={resourceType}
          newsId={newsId}
          programItemId={programItemId}
          programPointId={programPointId}
          onCommentAdded={onCommentAdded}
          onCommentUpdated={onCommentUpdated}
          onCommentDeleted={onCommentDeleted}
        />
      ))}
    </div>
  );
};

export default UserView;


import React from 'react';
import Comments from '../comments';

interface CommentsSectionProps {
  newsId: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ newsId }) => {
  return <Comments newsId={newsId} />;
};

export default CommentsSection;

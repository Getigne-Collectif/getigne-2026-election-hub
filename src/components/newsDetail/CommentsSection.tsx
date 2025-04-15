
import React from 'react';
import Comments from '../comments';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface CommentsSectionProps {
  newsId: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ newsId }) => {
  const [commentsEnabled, setCommentsEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const checkCommentsEnabled = async () => {
      try {
        console.log('Checking if comments are enabled for news ID:', newsId);
        const { data, error } = await supabase
          .from('news')
          .select('comments_enabled')
          .eq('id', newsId)
          .single();
          
        if (error) {
          console.error('Error checking if comments are enabled:', error);
          return;
        }
        
        console.log('Comments enabled data:', data);
        setCommentsEnabled(data.comments_enabled !== false);
      } catch (error) {
        console.error('Error in checkCommentsEnabled:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkCommentsEnabled();
  }, [newsId]);
  
  if (loading) {
    return <div className="mt-12 border-t border-getigne-100 pt-8">Chargement des commentaires...</div>;
  }
  
  if (!commentsEnabled) {
    return (
      <div className="mt-12 border-t border-getigne-100 pt-8">
        <h3 className="text-2xl font-bold mb-6">Commentaires</h3>
        <div className="text-center py-6 bg-getigne-50 rounded-lg">
          Les commentaires sont désactivés pour cet article.
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-12 border-t border-getigne-100 pt-8">
      <h3 className="text-2xl font-bold mb-6">Commentaires</h3>
      <Comments newsId={newsId} />
    </div>
  );
};

export default CommentsSection;

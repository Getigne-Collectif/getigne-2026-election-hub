
import React from 'react';
import Comments from '../comments';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface ProgramCommentsSectionProps {
  programItemId: string;
}

const ProgramCommentsSection: React.FC<ProgramCommentsSectionProps> = ({ programItemId }) => {
  const [commentsEnabled, setCommentsEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const checkCommentsEnabled = async () => {
      try {
        const { data, error } = await supabase
          .from('program_items')
          .select('comments_enabled')
          .eq('id', programItemId)
          .single();
          
        if (error) {
          console.error('Error checking if comments are enabled:', error);
          return;
        }
        
        setCommentsEnabled(data.comments_enabled !== false);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkCommentsEnabled();
  }, [programItemId]);
  
  if (loading) {
    return <div className="mt-12 border-t border-getigne-100 pt-8">Chargement des commentaires...</div>;
  }
  
  if (!commentsEnabled) {
    return (
      <div className="mt-12 border-t border-getigne-100 pt-8">
        <h3 className="text-2xl font-bold mb-6">Commentaires</h3>
        <div className="text-center py-6 bg-getigne-50 rounded-lg">
          Les commentaires sont désactivés pour cette section.
        </div>
      </div>
    );
  }
  
  return <Comments programItemId={programItemId} />;
};

export default ProgramCommentsSection;

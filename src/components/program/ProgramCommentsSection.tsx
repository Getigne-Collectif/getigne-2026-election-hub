
import React, { useState } from 'react';
import Comments from '../comments';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface ProgramCommentsSectionProps {
  programItemId: string;
  programPointId?: string;
}

const ProgramCommentsSection: React.FC<ProgramCommentsSectionProps> = ({ programItemId, programPointId }) => {
  const [commentsEnabled, setCommentsEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const checkCommentsEnabled = async () => {
      try {
        // Par défaut, les commentaires sont activés
        setCommentsEnabled(true);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };
    
    checkCommentsEnabled();
  }, [programItemId, programPointId]);
  
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
  
  return <Comments programItemId={programItemId} programPointId={programPointId} />;
};

export default ProgramCommentsSection;

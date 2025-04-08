
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ProgramLikeButtonProps {
  programId: string;
  programPointId?: string;
  initialLikes?: number;
}

const ProgramLikeButton: React.FC<ProgramLikeButtonProps> = ({
  programId,
  programPointId,
  initialLikes = 0,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserLike();
    }
  }, [user, programId, programPointId]);

  const checkUserLike = async () => {
    try {
      const { data, error } = await supabase
        .from('program_likes')
        .select('*')
        .eq('program_item_id', programId)
        .eq('user_id', user?.id || '');

      if (programPointId) {
        const filteredData = data?.filter(like => like.program_point_id === programPointId);
        setHasLiked(filteredData && filteredData.length > 0);
      } else {
        setHasLiked(data && data.length > 0);
      }

      if (error) {
        console.error('Error checking like:', error);
      }
    } catch (err) {
      console.error('Error in checkUserLike:', err);
    }
  };

  const fetchLikes = async () => {
    try {
      let query = supabase
        .from('program_likes')
        .select('*', { count: 'exact' })
        .eq('program_item_id', programId);

      if (programPointId) {
        query = query.eq('program_point_id', programPointId);
      }

      const { count, error } = await query;

      if (error) {
        throw error;
      }

      setLikes(count || 0);
    } catch (err) {
      console.error('Error fetching likes:', err);
    }
  };

  useEffect(() => {
    fetchLikes();
  }, [programId, programPointId]);

  const handleLike = async () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour aimer un point du programme.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (hasLiked) {
        // Unlike
        let query = supabase
          .from('program_likes')
          .delete()
          .eq('program_item_id', programId)
          .eq('user_id', user.id);

        if (programPointId) {
          query = query.eq('program_point_id', programPointId);
        }

        const { error } = await query;
        
        if (error) throw error;
        
        setLikes(prev => Math.max(0, prev - 1));
        setHasLiked(false);
      } else {
        // Like
        const likeData = {
          program_item_id: programId,
          user_id: user.id,
          program_point_id: programPointId || null
        };

        const { error } = await supabase
          .from('program_likes')
          .insert(likeData);
          
        if (error) throw error;
        
        setLikes(prev => prev + 1);
        setHasLiked(true);
      }
    } catch (err: any) {
      console.error('Error toggling like:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleLike}
      disabled={isLoading}
      className={`flex items-center gap-2 ${hasLiked ? 'text-red-500' : ''}`}
    >
      <Heart className={`h-4 w-4 ${hasLiked ? 'fill-red-500 text-red-500' : ''}`} />
      <span>{likes}</span>
    </Button>
  );
};

export default ProgramLikeButton;

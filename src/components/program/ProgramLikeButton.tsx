
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

      if (error) {
        console.error('Error checking like:', error);
      } else {
        // Currently the likes don't have program_point_id
        // In the future if that gets added we would check it here
        setHasLiked(data && data.length > 0);
      }
    } catch (err) {
      console.error('Error in checkUserLike:', err);
    }
  };

  const fetchLikes = async () => {
    try {
      const { count, error } = await supabase
        .from('program_likes')
        .select('*', { count: 'exact' })
        .eq('program_item_id', programId);

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
  }, [programId]);

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
        const { error } = await supabase
          .from('program_likes')
          .delete()
          .eq('program_item_id', programId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        setLikes(prev => Math.max(0, prev - 1));
        setHasLiked(false);
      } else {
        // Like
        const likeData = {
          program_item_id: programId,
          user_id: user.id
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

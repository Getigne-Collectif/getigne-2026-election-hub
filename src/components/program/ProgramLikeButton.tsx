
import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProgramLikeButtonProps {
  programItemId: string;
  pointId?: string;
}

const ProgramLikeButton: React.FC<ProgramLikeButtonProps> = ({ programItemId, pointId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserLike();
    }
    countLikes();
  }, [user, programItemId, pointId]);

  const checkUserLike = async () => {
    if (!user) return;

    try {
      const query = supabase
        .from('program_likes')
        .select('*')
        .eq('program_item_id', programItemId)
        .eq('user_id', user.id);
        
      // If pointId is provided, add that condition
      if (pointId) {
        query.eq('program_point_id', pointId);
      } else {
        query.is('program_point_id', null);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setHasLiked(data && data.length > 0);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const countLikes = async () => {
    try {
      const query = supabase
        .from('program_likes')
        .select('*', { count: 'exact', head: true })
        .eq('program_item_id', programItemId);
        
      // If pointId is provided, add that condition
      if (pointId) {
        query.eq('program_point_id', pointId);
      } else {
        query.is('program_point_id', null);
      }
      
      const { count, error } = await query;
      
      if (error) throw error;
      setLikeCount(count || 0);
    } catch (error) {
      console.error('Error counting likes:', error);
    }
  };

  const toggleLike = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour aimer cet élément du programme.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (hasLiked) {
        // Remove like
        const query = supabase
          .from('program_likes')
          .delete()
          .eq('program_item_id', programItemId)
          .eq('user_id', user.id);
          
        // If pointId is provided, add that condition
        if (pointId) {
          query.eq('program_point_id', pointId);
        } else {
          query.is('program_point_id', null);
        }
        
        const { error } = await query;
        
        if (error) throw error;
        
        setHasLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        // Add like
        const { error } = await supabase
          .from('program_likes')
          .insert({
            program_item_id: programItemId,
            user_id: user.id,
            program_point_id: pointId || null
          });
          
        if (error) throw error;
        
        setHasLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`flex items-center gap-1 ${
        hasLiked ? 'text-red-500 hover:text-red-600' : 'text-getigne-600 hover:text-getigne-700'
      }`}
      onClick={toggleLike}
      disabled={loading || !user}
    >
      <Heart className={`h-5 w-5 ${hasLiked ? 'fill-current' : ''}`} />
      <span>{likeCount}</span>
    </Button>
  );
};

export default ProgramLikeButton;

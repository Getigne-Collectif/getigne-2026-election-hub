import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ResourceType } from '@/types/comments.types';

interface CommentLikeButtonProps {
  commentId: string;
  resourceType: ResourceType;
  initialLikesCount?: number;
  initialIsLiked?: boolean;
  onLikeChange?: (likesCount: number, isLiked: boolean) => void;
}

const CommentLikeButton: React.FC<CommentLikeButtonProps> = ({
  commentId,
  resourceType,
  initialLikesCount = 0,
  initialIsLiked = false,
  onLikeChange,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [loading, setLoading] = useState(false);

  // Vérifier si l'utilisateur a déjà liké ce commentaire
  useEffect(() => {
    if (user) {
      checkIfLiked();
    }
  }, [user, commentId]);

  const checkIfLiked = async () => {
    if (!user) return;

    try {
      const likesTable = resourceType === 'news' ? 'comment_likes' : 'program_comment_likes';
      const { data, error } = await supabase
        .from(likesTable)
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking like status:', error);
        return;
      }

      setIsLiked(!!data);
    } catch (error) {
      console.error('Error in checkIfLiked:', error);
    }
  };

  const fetchLikesCount = async () => {
    try {
      const likesTable = resourceType === 'news' ? 'comment_likes' : 'program_comment_likes';
      const { count, error } = await supabase
        .from(likesTable)
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId);

      if (error) {
        console.error('Error fetching likes count:', error);
        return;
      }

      setLikesCount(count || 0);
    } catch (error) {
      console.error('Error in fetchLikesCount:', error);
    }
  };

  useEffect(() => {
    fetchLikesCount();
  }, [commentId]);

  const handleToggleLike = async () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour liker un commentaire.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const likesTable = resourceType === 'news' ? 'comment_likes' : 'program_comment_likes';

      if (isLiked) {
        // Retirer le like
        const { error } = await supabase
          .from(likesTable)
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;

        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
        onLikeChange?.(likesCount - 1, false);
      } else {
        // Ajouter le like
        const { error } = await supabase
          .from(likesTable)
          .insert([
            {
              comment_id: commentId,
              user_id: user.id,
            },
          ]);

        if (error) throw error;

        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
        onLikeChange?.(likesCount + 1, true);
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue lors de l'opération.",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleLike}
      disabled={loading || !user}
      className={`flex items-center gap-1.5 ${
        isLiked ? 'text-getigne-accent hover:text-getigne-accent/80' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
      <span className="text-sm">{likesCount}</span>
    </Button>
  );
};

export default CommentLikeButton;


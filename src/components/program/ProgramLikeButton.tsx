
import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProgramLikeButtonProps {
  programItemId: string;
  pointId?: string;
  initialLikesCount?: number;
}

const ProgramLikeButton = ({ programItemId, pointId, initialLikesCount = 0 }: ProgramLikeButtonProps) => {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [pendingLike, setPendingLike] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');

  // Déterminer le type de ressource
  const resourceType = pointId ? 'program_point' : 'program_item';
  const resourceId = pointId || programItemId;

  // Vérifier si l'utilisateur a déjà liké cet élément
  useEffect(() => {
    const checkIfLiked = async () => {
      if (!user) {
        setIsLiked(false);
        return;
      }

      try {
        let query = supabase
          .from('program_likes')
          .select('id')
          .eq('program_item_id', programItemId)
          .eq('user_id', user.id);
          
        // Add condition for program point if provided
        if (pointId) {
          query = query.eq('program_point_id', pointId);
        } else {
          query = query.is('program_point_id', null);
        }
          
        const { data, error } = await query.maybeSingle();

        if (error) throw error;
        setIsLiked(!!data);
      } catch (error) {
        console.error('Erreur lors de la vérification du like:', error);
      }
    };

    const fetchLikesCount = async () => {
      try {
        // Count likes using a query based on resource type
        let query = supabase
          .from('program_likes')
          .select('*', { count: 'exact' })
          .eq('program_item_id', programItemId);
          
        if (pointId) {
          query = query.eq('program_point_id', pointId);
        } else {
          query = query.is('program_point_id', null);
        }
            
        const { count, error } = await query;
            
        if (error) throw error;
        setLikesCount(count || 0);
      } catch (countError) {
        console.error('Erreur de comptage:', countError);
        setLikesCount(0);
      }
    };

    checkIfLiked();
    fetchLikesCount();
  }, [programItemId, pointId, resourceId, resourceType, user]);

  // Gérer le like/unlike
  const handleLikeToggle = async () => {
    // Si l'utilisateur n'est pas connecté, ouvrir la boîte de dialogue d'authentification
    if (!user) {
      setPendingLike(true);
      setAuthDialogOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      if (isLiked) {
        // Supprimer le like
        let query = supabase
          .from('program_likes')
          .delete()
          .eq('program_item_id', programItemId)
          .eq('user_id', user.id);
          
        if (pointId) {
          query = query.eq('program_point_id', pointId);
        } else {
          query = query.is('program_point_id', null);
        }
          
        const { error } = await query;

        if (error) throw error;
        
        setLikesCount(prev => Math.max(0, prev - 1));
        setIsLiked(false);
        toast.success('Votre like a été retiré');
      } else {
        // Ajouter le like
        const likeData: any = { 
          user_id: user.id,
          program_item_id: programItemId
        };
        
        // Ajouter le bon champ selon le type
        if (pointId) {
          likeData.program_point_id = pointId;
        }
        
        const { error } = await supabase
          .from('program_likes')
          .insert([likeData]);

        if (error) throw error;
        
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
        toast.success('Merci pour votre soutien !');
      }
    } catch (error: any) {
      console.error('Erreur lors du like/unlike:', error);
      toast.error("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Après une authentification réussie, fermer la boîte de dialogue
  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);
    
    // Ajouter un petit délai pour s'assurer que le contexte d'authentification est mis à jour
    setTimeout(() => {
      if (pendingLike) {
        handleLikeToggle();
        setPendingLike(false);
      }
    }, 500);
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className={`flex items-center gap-1 ${isLiked ? 'bg-pink-50 text-pink-600 hover:bg-pink-100 hover:text-pink-700' : ''}`}
        onClick={handleLikeToggle}
        disabled={isLoading}
      >
        <Heart 
          className={`h-4 w-4 ${isLiked ? 'fill-pink-500 text-pink-500' : ''}`} 
        />
        <span>{likesCount}</span>
      </Button>

      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connectez-vous pour soutenir cette proposition</DialogTitle>
          </DialogHeader>
          
          <Tabs value={authTab} onValueChange={(value) => setAuthTab(value as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Se connecter</TabsTrigger>
              <TabsTrigger value="signup">Créer un compte</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <SignInForm onSuccess={handleAuthSuccess} />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignUpForm onSuccess={handleAuthSuccess} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProgramLikeButton;


import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Cette fonction vérifie si le bucket news_images existe et le crée si nécessaire.
 * Elle peut être utilisée pendant le chargement initial de l'application.
 */
export const setupNewsImagesBucket = async () => {
  try {
    // Vérifie si le bucket existe déjà
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketError) {
      console.error('Erreur lors de la vérification des buckets:', bucketError);
      return false;
    }
    
    const newsImagesBucketExists = buckets.some(bucket => bucket.name === 'news_images');
    
    if (!newsImagesBucketExists) {
      console.log('Le bucket news_images n\'existe pas, une action SQL est nécessaire');
      // Au lieu d'essayer de créer le bucket ici (ce qui pourrait échouer à cause des politiques RLS),
      // on informe simplement l'utilisateur que le bucket n'existe pas
      toast({
        title: 'Attention',
        description: 'Le bucket de stockage pour les images n\'existe pas. Contactez l\'administrateur.',
        variant: 'destructive'
      });
      return false;
    }
    
    console.log('Bucket news_images trouvé avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de la configuration du bucket news_images:', error);
    return false;
  }
};

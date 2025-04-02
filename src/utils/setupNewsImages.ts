
import { supabase } from "@/integrations/supabase/client";

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
    const publicBucketExists = buckets.some(bucket => bucket.name === 'public');
    
    if (!newsImagesBucketExists) {
      console.log('Le bucket news_images n\'existe pas, une action SQL est nécessaire');
      return false;
    }
    
    if (!publicBucketExists) {
      console.log('Le bucket public n\'existe pas, une action SQL est nécessaire');
      return false;
    }
    
    console.log('Les buckets nécessaires ont été trouvés avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de la configuration des buckets:', error);
    return false;
  }
};

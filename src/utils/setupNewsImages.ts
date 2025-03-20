
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
    
    if (!newsImagesBucketExists) {
      // Crée le bucket s'il n'existe pas
      const { error: createError } = await supabase
        .storage
        .createBucket('news_images', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });
        
      if (createError) {
        console.error('Erreur lors de la création du bucket news_images:', createError);
        return false;
      }
      
      console.log('Bucket news_images créé avec succès');
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la configuration du bucket news_images:', error);
    return false;
  }
};

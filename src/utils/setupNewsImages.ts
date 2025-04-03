
import { supabase } from "@/integrations/supabase/client";

/**
 * Cette fonction vérifie si les buckets nécessaires existent et les crée si nécessaire.
 * Elle peut être utilisée pendant le chargement initial de l'application.
 */
export const setupNewsImagesBucket = async () => {
  try {
    // Vérifie si les buckets existent déjà
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketError) {
      console.error('Erreur lors de la vérification des buckets:', bucketError);
      return false;
    }
    
    const newsImagesBucketExists = buckets.some(bucket => bucket.name === 'news_images');
    const publicBucketExists = buckets.some(bucket => bucket.name === 'public');
    const avatarsBucketExists = buckets.some(bucket => bucket.name === 'avatars');
    const committeeCoversBucketExists = buckets.some(bucket => bucket.name === 'committee_covers');
    
    if (!newsImagesBucketExists) {
      console.log('Le bucket news_images n\'existe pas, une action SQL est nécessaire');
      return false;
    }
    
    if (!publicBucketExists) {
      console.log('Le bucket public n\'existe pas, une action SQL est nécessaire');
      return false;
    }
    
    if (!avatarsBucketExists) {
      console.log('Le bucket avatars n\'existe pas, une action SQL est nécessaire');
      return false;
    }

    if (!committeeCoversBucketExists) {
      console.log('Le bucket committee_covers n\'existe pas, une action SQL est nécessaire');
      
      // Tentative de création du bucket committee_covers
      try {
        const { error } = await supabase.storage.createBucket('committee_covers', {
          public: true
        });
        
        if (error) {
          console.error('Erreur lors de la création du bucket committee_covers:', error);
          return false;
        }
        
        console.log('Bucket committee_covers créé avec succès');
      } catch (createError) {
        console.error('Exception lors de la création du bucket committee_covers:', createError);
        return false;
      }
    }
    
    console.log('Les buckets nécessaires ont été trouvés ou créés avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de la configuration des buckets:', error);
    return false;
  }
};

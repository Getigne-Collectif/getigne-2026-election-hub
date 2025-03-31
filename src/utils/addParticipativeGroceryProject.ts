
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Cette fonction télécharge une image dans le bucket cms_assets et ajoute
 * un projet d'épicerie participative à la base de données
 */
export const addParticipativeGroceryProject = async () => {
  try {
    // 1. Récupérer l'image depuis internet
    const imageUrl = 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&q=80&w=1000';
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');
    
    const imageBlob = await response.blob();
    const fileName = 'epicerie-participative.jpg';
    const filePath = `projects/${fileName}`;

    // 2. Télécharger l'image vers Supabase
    const { error: uploadError } = await supabase.storage
      .from('cms_assets')
      .upload(filePath, imageBlob, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error("Erreur lors du téléchargement de l'image:", uploadError);
      throw uploadError;
    }

    // 3. Récupérer l'URL publique de l'image
    const { data: publicUrlData } = supabase.storage
      .from('cms_assets')
      .getPublicUrl(filePath);

    const imagePublicUrl = publicUrlData.publicUrl;

    // 4. Créer le projet dans la base de données
    const projectData = {
      title: "Épicerie participative",
      description: "Création d'une épicerie participative sur le modèle du réseau monépi (monepi.fr). Cette initiative vise à proposer une solution vertueuse de A à Z, bénéficiant à la fois aux consommateurs qui auront accès à des produits de première qualité, et aux producteurs locaux qui disposeront d'un nouveau point de vente au centre de la commune. Les membres participent à la gestion du lieu à hauteur de quelques heures par mois, ce qui permet de réduire les coûts et de créer du lien social.",
      image: imagePublicUrl,
      contact_email: "epicerie@getigne-collectif.fr",
      status: "active",
      is_featured: true,
      url: "https://www.monepi.fr",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sort_order: 10
    };

    const { error: insertError } = await supabase
      .from('projects')
      .insert([projectData]);

    if (insertError) {
      console.error("Erreur lors de l'ajout du projet:", insertError);
      throw insertError;
    }

    return true;
  } catch (error) {
    console.error("Erreur:", error);
    toast.error("Échec de l'ajout du projet d'épicerie participative");
    throw error;
  }
};

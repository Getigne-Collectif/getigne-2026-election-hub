
import { supabase } from '@/integrations/supabase/client';

/**
 * Cette fonction ajoute directement le projet d'épicerie participative
 * à la base de données avec une photo.
 */
export async function addParticipativeGrocery() {
  // Définir les détails du projet
  const projectData = {
    title: "Épicerie participative",
    description: "Création d'une épicerie participative sur le modèle du réseau monépi (monepi.fr). Cette initiative vise à proposer une solution vertueuse de A à Z, bénéficiant à la fois aux consommateurs qui auront accès à des produits de première qualité, et aux producteurs locaux qui disposeront d'un nouveau point de vente au centre de la commune. Les membres participent à la gestion du lieu à hauteur de quelques heures par mois, ce qui permet de réduire les coûts et de créer du lien social.",
    contact_email: "epicerie@getigne-collectif.fr",
    status: "active",
    is_featured: true,
    url: "https://www.monepi.fr",
    sort_order: 10
  };

  try {
    // 1. Télécharger l'image depuis unsplash
    const imageUrl = 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&q=80&w=1000';
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Erreur lors du téléchargement de l'image");
    }

    const imageBlob = await imageResponse.blob();
    const fileName = `epicerie-participative-${Date.now()}.jpg`;
    const filePath = `projects/${fileName}`;

    // 2. Télécharger l'image vers Supabase Storage
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

    // 3. Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('cms_assets')
      .getPublicUrl(filePath);

    // 4. Insérer le projet avec l'URL de l'image
    const { error: insertError } = await supabase
      .from('projects')
      .insert([{
        ...projectData,
        image: urlData.publicUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error("Erreur lors de l'insertion du projet:", insertError);
      throw insertError;
    }

    console.log("Projet d'épicerie participative ajouté avec succès");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout du projet d'épicerie participative:", error);
    throw error;
  }
}

// Exécuter la fonction immédiatement
addParticipativeGrocery().catch(console.error);

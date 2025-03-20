
import { supabase } from '@/integrations/supabase/client';
import { sendDiscordNotification, DiscordColors } from './notifications';

export interface NewsletterSubscription {
  email: string;
  name?: string;
  url?: string; // URL de la page où le formulaire a été soumis
}

export const subscribeToNewsletter = async (data: NewsletterSubscription) => {
  try {
    // Ajouter l'URL actuelle si elle n'est pas fournie
    const enhancedData = {
      ...data,
      url: data.url || window.location.href
    };

    // Notifier Discord de la nouvelle inscription à la newsletter
    await sendDiscordNotification({
      title: "Nouvelle inscription à la newsletter",
      message: `Email: ${enhancedData.email}${enhancedData.name ? `\nNom: ${enhancedData.name}` : ''}`,
      color: DiscordColors.GREEN,
      username: "Newsletter Bot",
      url: enhancedData.url,
      resourceType: 'user'
    });

    // TODO: Ajouter ici la logique pour enregistrer l'email dans une base de données ou l'envoyer à un service de newsletter
    // Pour l'instant nous n'avons pas de service de newsletter configuré, donc nous n'implémentons que la notification Discord
    
    return { success: true };
  } catch (error) {
    console.error('Failed to subscribe to newsletter:', error);
    throw error;
  }
};

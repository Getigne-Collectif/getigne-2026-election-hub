
import { sendDiscordNotification, DiscordColors } from './notifications';

export interface NewsletterSubscription {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
}

export const subscribeToNewsletter = async (subscription: NewsletterSubscription) => {
  try {
    // Appeler la Edge Function Supabase pour ajouter l'email à Mailchimp
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de l\'appel à la fonction newsletter');
    }

    const result = await response.json();
    console.log("Email ajouté à Mailchimp via Edge Function:", result);

    // Envoyer une notification Discord
    const newsletterOptions = {
      title: "🐵 Nouvelle inscription à la newsletter",
      message: `Email: ${subscription.email}\nPrénom: ${subscription.firstName || 'Non renseigné'}\nNom: ${subscription.lastName || 'Non renseigné'}\nSource: ${subscription.source || 'Non spécifiée'}\nL\'email a été automatiquement ajouté à la liste Mailchimp.`,
      color: DiscordColors.GREEN,
      username: "Newsletter Gétigné Collectif"
    };

    await sendDiscordNotification(newsletterOptions);
    
    return { success: true, mailchimpId: result.mailchimpId };
  } catch (error: any) {
    console.error("Erreur lors de l'inscription à la newsletter:", error);
    
    // En cas d'erreur, on envoie quand même la notification Discord
    const newsletterOptions = {
      title: "Erreur inscription newsletter",
      message: `Email: ${subscription.email}\nErreur: ${error.message || 'Erreur inconnue'}`,
      color: DiscordColors.RED,
      username: "Newsletter Gétigné Collectif"
    };

    await sendDiscordNotification(newsletterOptions);
    
    throw new Error(`Erreur lors de l'inscription à la newsletter: ${error.message}`);
  }
};

export const sendNewsletterNotification = async (title: string, content: string) => {
  const newsletterOptions = {
    title: title,
    message: content,
    color: DiscordColors.BLUE,
    username: "Newsletter Gétigné Collectif"
  };

  await sendDiscordNotification(newsletterOptions);
};

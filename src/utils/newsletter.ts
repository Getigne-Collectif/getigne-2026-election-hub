
import { sendDiscordNotification, DiscordColors } from './notifications';

export interface NewsletterSubscription {
  email: string;
}

export const subscribeToNewsletter = async (subscription: NewsletterSubscription) => {
  const newsletterOptions = {
    title: "Nouvelle inscription à la newsletter",
    message: `Email: ${subscription.email}`,
    color: DiscordColors.GREEN,
    username: "Newsletter Gétigné Collectif"
  };

  await sendDiscordNotification(newsletterOptions);
  
  // Ici, vous pourriez ajouter l'email à une base de données ou un service de newsletter
  console.log("Email inscrit à la newsletter:", subscription.email);
  
  return { success: true };
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

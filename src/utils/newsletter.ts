
import { sendDiscordNotification, DiscordColors, DiscordMessageOptions } from './notifications';

export const sendNewsletterNotification = async (title: string, content: string) => {
  const newsletterOptions: DiscordMessageOptions = {
    title: title,
    message: content,
    color: DiscordColors.BLUE,
    username: "Newsletter Gétigné Collectif"
  };

  await sendDiscordNotification(newsletterOptions);
};

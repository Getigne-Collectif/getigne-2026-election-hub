
import { supabase } from '../integrations/supabase/client';

/**
 * Send a notification to Discord
 * @param title Optional title for the notification
 * @param message The message to send
 * @param color Optional color for the Discord embed (as a decimal number)
 * @param username Optional username override for the webhook
 * @returns A promise that resolves when the notification is sent
 */
export const sendDiscordNotification = async ({
  title,
  message,
  color,
  username
}: {
  title?: string;
  message: string;
  color?: number;
  username?: string;
}) => {
  try {
    const { data, error } = await supabase.functions.invoke('discord-notify', {
      body: { title, message, color, username }
    });

    if (error) {
      console.error('Error sending Discord notification:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
    throw error;
  }
};

// Discord colors (for reference)
export const DiscordColors = {
  RED: 16711680,      // #FF0000
  GREEN: 5763719,     // #57F287
  BLUE: 3447003,      // #3498DB
  YELLOW: 16776960,   // #FFFF00
  PURPLE: 10181046,   // #9B59B6
  ORANGE: 15105570,   // #E67E22
  GREY: 9807270,      // #95A5A6
  DEFAULT: 3447003,   // #3498DB (blue)
};

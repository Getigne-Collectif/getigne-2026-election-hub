
/**
 * Utilitaire pour envoyer des notifications à Discord
 */

export enum DiscordColors {
  BLUE = 3447003,     // #3498db
  GREEN = 5763719,    // #57F287
  YELLOW = 16705372,  // #FECC23
  RED = 15548997,     // #ED4245
  PURPLE = 10181046,  // #9B59B6
  TEAL = 1752220,     // #1ABC9C
  ORANGE = 15105570,  // #E67E22
}

interface DiscordMessageOptions {
  title: string;
  message: string;
  color?: DiscordColors;
  username?: string;
  url?: string;
  timestamp?: string;
}

/**
 * Envoie une notification à Discord via une Edge Function
 */
export const sendDiscordNotification = async (options: DiscordMessageOptions): Promise<void> => {
  try {
    const response = await fetch('/api/discord-notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorResponse = await response.text();
      console.error('Discord notification error:', errorResponse);
      throw new Error(`Erreur lors de l'envoi de la notification (${response.status})`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification Discord:', error);
    throw error;
  }
};

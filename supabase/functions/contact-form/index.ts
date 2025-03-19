
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Environment variables
const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL');
const CONTACT_EMAIL = Deno.env.get('CONTACT_EMAIL') || 'contact@getigne-collectif.fr';
const PUBLIC_URL = Deno.env.get('PUBLIC_URL') || 'https://getigne-collectif.fr';

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  source?: string; // "contact" or "committee"
  committeeId?: string;
  committeeTitle?: string;
  url?: string; // URL de la page où le formulaire a été soumis
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const requestData: ContactFormRequest = await req.json();
    const { 
      name, 
      email, 
      subject, 
      message, 
      source = "contact", 
      committeeId, 
      committeeTitle,
      url = null
    } = requestData;

    console.log("Contact form submission:", requestData);

    // Send to Discord
    if (DISCORD_WEBHOOK_URL) {
      const isCommittee = source === "committee";
      const discordTitle = isCommittee 
        ? `📬 Nouveau message pour la commission: ${committeeTitle}` 
        : `📬 Nouveau message de contact`;

      // Déterminer l'URL de contexte
      let contextUrl = '';
      if (url) {
        contextUrl = url;
      } else if (isCommittee && committeeId) {
        contextUrl = `${PUBLIC_URL}/commissions/${committeeId}`;
      } else {
        contextUrl = `${PUBLIC_URL}/contact`;
      }

      const discordMessage = `
**De**: ${name} (${email})
**Sujet**: ${subject}
${isCommittee ? `**Commission**: ${committeeTitle}` : ''}
**Page**: ${contextUrl}

**Message**:
${message}
      `;

      // Send message to Discord
      const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: isCommittee ? "Système des Commissions" : "Système de Contact",
          embeds: [
            {
              title: discordTitle,
              description: discordMessage,
              color: isCommittee ? 5793266 : 3447003, // Green for committee, blue for general contact
              timestamp: new Date().toISOString(),
              url: contextUrl, // Ajouter l'URL comme lien cliquable dans le titre
            },
          ],
        }),
      });

      if (!discordResponse.ok) {
        console.error("Discord API error:", await discordResponse.text());
      } else {
        console.log("Discord notification sent successfully");
      }
    }

    // TODO: Add email sending functionality when needed
    // Currently just notifying through Discord

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Message envoyé avec succès" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing contact form:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur est survenue" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

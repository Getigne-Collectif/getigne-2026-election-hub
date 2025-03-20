
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Webhook URL from environment variable
const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL');
const PUBLIC_URL = Deno.env.get('PUBLIC_URL') || 'https://getigne-collectif.fr';

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  title?: string;
  message: string;
  color?: number; // Discord embed color (optional)
  username?: string; // Override the webhook's default username
  url?: string; // URL de contexte (page où l'action a été effectuée)
  resourceId?: string; // ID de la ressource (article, événement, etc.)
  resourceType?: string; // Type de ressource (article, event, etc.)
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook URL is configured
    if (!DISCORD_WEBHOOK_URL) {
      console.error("Discord webhook URL not configured");
      return new Response(
        JSON.stringify({ error: "Discord webhook URL not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse the request body
    const requestData: NotificationRequest = await req.json();
    const { 
      message, 
      title, 
      color = 3447003, 
      username,
      url,
      resourceId,
      resourceType 
    } = requestData; // Default blue color if not specified

    console.log("Notification request:", requestData);

    // Déterminer l'URL de contexte si elle n'est pas fournie
    let contextUrl = url;
    if (!contextUrl && resourceId && resourceType) {
      switch(resourceType) {
        case 'news':
          contextUrl = `${PUBLIC_URL}/actualites/${resourceId}`;
          break;
        case 'event':
          contextUrl = `${PUBLIC_URL}/agenda/${resourceId}`;
          break;
        case 'committee':
          contextUrl = `${PUBLIC_URL}/commissions/${resourceId}`;
          break;
        default:
          contextUrl = PUBLIC_URL;
      }
    }

    // Prepare the Discord message payload
    const payload = {
      username: username || "Notification Bot",
      embeds: [
        {
          title: title || "Notification",
          description: message,
          color: color,
          timestamp: new Date().toISOString(),
          url: contextUrl, // Ajouter l'URL comme lien cliquable sur le titre
        },
      ],
    };

    // Send the message to Discord
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Discord API error:", response.status, errorData);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send Discord notification", 
          details: errorData 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Discord notification sent successfully");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification envoyée avec succès" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing Discord notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur est survenue" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

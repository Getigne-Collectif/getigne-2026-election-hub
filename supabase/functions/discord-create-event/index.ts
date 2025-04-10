
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuration des variables d'environnement
const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID');
const PUBLIC_URL = Deno.env.get('PUBLIC_URL') || 'https://getigne-collectif.fr';

// CORS headers pour les requêtes depuis le navigateur
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DiscordEventRequest {
  name: string;
  description: string;
  scheduledStartTime: string;  // ISO 8601 timestamp
  scheduledEndTime?: string;   // ISO 8601 timestamp (optionnel)
  location: string;
  entityType?: 'EXTERNAL' | 'VOICE' | 'STAGE';  // Défaut: EXTERNAL
}

serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier que le token bot Discord est configuré
    if (!DISCORD_BOT_TOKEN) {
      console.error("Discord bot token not configured");
      return new Response(
        JSON.stringify({ error: "Discord bot token not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier que l'ID du serveur Discord est configuré
    if (!DISCORD_GUILD_ID) {
      console.error("Discord guild ID not configured");
      return new Response(
        JSON.stringify({ error: "Discord guild ID not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Analyser les données de la requête
    const requestData: DiscordEventRequest = await req.json();
    const { 
      name,
      description,
      scheduledStartTime,
      scheduledEndTime,
      location,
      entityType = 'EXTERNAL'
    } = requestData;

    console.log("Discord event request:", requestData);

    // Préparer les données pour l'API Discord
    const eventData = {
      name,
      description,
      scheduled_start_time: scheduledStartTime,
      scheduled_end_time: scheduledEndTime,
      entity_type: entityType,
      privacy_level: 2, // GUILD_ONLY
      entity_metadata: {
        location
      }
    };

    // Envoyer la requête à l'API Discord pour créer l'événement
    const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/scheduled-events`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    // Récupérer la réponse
    const responseData = await response.json();

    if (!response.ok) {
      console.error("Discord API error:", response.status, responseData);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create Discord event", 
          details: responseData 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Discord event created successfully:", responseData);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Événement Discord créé avec succès",
        event: responseData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating Discord event:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur est survenue" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

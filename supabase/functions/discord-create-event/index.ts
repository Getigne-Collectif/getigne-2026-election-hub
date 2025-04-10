
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

// Constantes pour les types d'événement Discord
const ENTITY_TYPES = {
  EXTERNAL: 3,  // Événement externe (hors Discord)
  VOICE: 2,     // Événement dans un salon vocal
  STAGE: 1      // Événement dans un salon de conférence
};

interface DiscordEventRequest {
  name: string;
  description: string;
  scheduledStartTime: string;  // ISO 8601 timestamp
  scheduledEndTime?: string;   // ISO 8601 timestamp (optionnel)
  location: string;
  entityType?: 'EXTERNAL' | 'VOICE' | 'STAGE';  // Défaut: EXTERNAL
  image?: string;              // URL de l'image
  committee?: string;          // Nom de la commission organisatrice
  slug?: string;               // Slug pour construire l'URL de l'événement
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
      entityType = 'EXTERNAL',
      image,
      committee,
      slug
    } = requestData;

    console.log("Discord event request:", requestData);

    // Convertir le type d'entité en valeur numérique pour l'API Discord
    const entityTypeValue = ENTITY_TYPES[entityType];
    
    // Créer l'URL complète de l'événement
    const eventUrl = slug ? `${PUBLIC_URL}/agenda/${slug}` : null;
    
    // Enrichir la description avec l'URL et les infos de commission
    let enhancedDescription = description;
    
    if (eventUrl) {
      enhancedDescription += `\n\n📎 Plus d'informations : ${eventUrl}`;
    }
    
    if (committee) {
      enhancedDescription += `\n\n👥 Événement organisé par la commission ${committee}`;
    }

    // Préparer les données pour l'API Discord
    const eventData: any = {
      name,
      description: enhancedDescription,
      scheduled_start_time: scheduledStartTime,
      scheduled_end_time: scheduledEndTime,
      entity_type: entityTypeValue,
      privacy_level: 2, // GUILD_ONLY
      entity_metadata: {
        location
      }
    };
    
    // Ajouter l'image si elle est fournie
    if (image) {
      try {
        // Télécharger l'image pour la fournir à Discord
        const imageResponse = await fetch(image);
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();
          const formData = new FormData();
          
          // Ajouter les données de l'événement au formData
          formData.append('payload_json', JSON.stringify(eventData));
          
          // Ajouter l'image au formData
          formData.append('image', imageBlob);
          
          console.log("Sending to Discord API with image");
          
          // Envoyer la requête avec formData pour inclure l'image
          const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/scheduled-events`, {
            method: "POST",
            headers: {
              "Authorization": `Bot ${DISCORD_BOT_TOKEN}`
            },
            body: formData
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

          console.log("Discord event created successfully with image:", responseData);
          
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
        } else {
          console.error("Failed to fetch image:", imageResponse.statusText);
          // Si l'image ne peut pas être récupérée, continuer sans image
        }
      } catch (imageError) {
        console.error("Error processing image:", imageError);
        // Si une erreur se produit lors du traitement de l'image, continuer sans image
      }
    }
    
    // Si nous arrivons ici, soit il n'y a pas d'image, soit le traitement de l'image a échoué
    // Envoyer la requête sans image
    console.log("Sending to Discord API without image:", eventData);

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

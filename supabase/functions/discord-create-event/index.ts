
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
    let requestData: DiscordEventRequest;
    try {
      requestData = await req.json();
      console.log("Received request data:", JSON.stringify({
        name: requestData.name,
        description: requestData.description?.substring(0, 100) + "...",
        location: requestData.location,
        entityType: requestData.entityType,
        committee: requestData.committee,
        slug: requestData.slug,
        hasImage: !!requestData.image,
        imageLength: requestData.image ? requestData.image.length : 0
      }));
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({ error: "Invalid request body", details: error.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
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

    // Validation des champs obligatoires
    if (!name || !description || !scheduledStartTime || !location) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields",
          details: { 
            name: !!name, 
            description: !!description, 
            scheduledStartTime: !!scheduledStartTime, 
            location: !!location 
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
      privacy_level: 2, // GUILD_ONLY
      entity_type: entityTypeValue,
      entity_metadata: {
        location
      }
    };
    
    if (scheduledEndTime) {
      eventData.scheduled_end_time = scheduledEndTime;
    }
    
    console.log("Prepared Discord event data:", JSON.stringify(eventData));
    
    // Variable pour stocker la réponse finale de Discord
    let responseData;
    
    // Ajouter l'image si elle est fournie et si c'est une URL valide
    if (image && typeof image === 'string') {
      // Vérifier si c'est une URL d'image valide (commence par http ou data:)
      if (image.startsWith('http') || image.startsWith('https')) {
        try {
          console.log("Fetching image from URL");
          // Télécharger l'image pour la fournir à Discord
          const imageResponse = await fetch(image);
          if (!imageResponse.ok) {
            console.error("Failed to fetch image from URL:", imageResponse.status, imageResponse.statusText);
            throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
          }
          
          const contentType = imageResponse.headers.get('content-type');
          if (!contentType || !contentType.startsWith('image/')) {
            console.error("URL does not point to an image. Content-Type:", contentType);
            throw new Error(`URL does not point to an image. Content-Type: ${contentType}`);
          }
          
          // Limiter la taille de l'image pour éviter les problèmes
          const MAX_IMAGE_SIZE = 1024 * 1024 * 8; // 8 MB maximum
          const imageBlob = await imageResponse.blob();
          if (imageBlob.size > MAX_IMAGE_SIZE) {
            console.error("Image too large:", imageBlob.size, "bytes. Max size:", MAX_IMAGE_SIZE);
            throw new Error(`Image too large: ${imageBlob.size} bytes. Max size: ${MAX_IMAGE_SIZE}`);
          }
          
          const formData = new FormData();
          
          // Ajouter les données de l'événement au formData
          formData.append('payload_json', JSON.stringify(eventData));
          
          // Ajouter l'image au formData
          formData.append('image', imageBlob);
          
          console.log("Sending request to Discord API with image");
          
          // Envoyer la requête avec formData pour inclure l'image
          const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/scheduled-events`, {
            method: "POST",
            headers: {
              "Authorization": `Bot ${DISCORD_BOT_TOKEN}`
            },
            body: formData
          });
          
          // Récupérer la réponse
          responseData = await response.json();
          
          if (!response.ok) {
            console.error("Discord API error:", response.status, JSON.stringify(responseData));
            return new Response(
              JSON.stringify({ 
                error: "Failed to create Discord event", 
                details: responseData,
                status: response.status
              }),
              {
                status: response.status,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          
          console.log("Discord event created successfully with image");
          
        } catch (imageError) {
          console.error("Error processing image:", imageError);
          // Continuer sans image en cas d'erreur
          console.log("Continuing without image due to error");
        }
      } else if (image.startsWith('data:image/')) {
        try {
          console.log("Processing data URL image");
          // C'est une image en base64
          // Extraire le type MIME et les données de base64
          const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          
          if (!matches || matches.length !== 3) {
            console.error("Invalid data URL format");
            throw new Error("Invalid data URL format");
          }
          
          const [, mimeType, base64Data] = matches;
          
          if (!mimeType.startsWith('image/')) {
            console.error("Data URL is not an image. MIME type:", mimeType);
            throw new Error(`Data URL is not an image. MIME type: ${mimeType}`);
          }
          
          // Convertir en Uint8Array
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          // Limiter la taille de l'image
          const MAX_IMAGE_SIZE = 1024 * 1024 * 8; // 8 MB maximum
          if (binaryData.length > MAX_IMAGE_SIZE) {
            console.error("Image too large:", binaryData.length, "bytes. Max size:", MAX_IMAGE_SIZE);
            throw new Error(`Image too large: ${binaryData.length} bytes. Max size: ${MAX_IMAGE_SIZE}`);
          }
          
          // Créer un Blob à partir des données binaires
          const blob = new Blob([binaryData], { type: mimeType });
          
          const formData = new FormData();
          
          // Ajouter les données de l'événement au formData
          formData.append('payload_json', JSON.stringify(eventData));
          
          // Ajouter l'image au formData
          formData.append('image', blob);
          
          console.log("Sending request to Discord API with base64 image");
          
          // Envoyer la requête avec formData pour inclure l'image
          const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/scheduled-events`, {
            method: "POST",
            headers: {
              "Authorization": `Bot ${DISCORD_BOT_TOKEN}`
            },
            body: formData
          });
          
          // Récupérer la réponse
          responseData = await response.json();
          
          if (!response.ok) {
            console.error("Discord API error:", response.status, JSON.stringify(responseData));
            return new Response(
              JSON.stringify({ 
                error: "Failed to create Discord event", 
                details: responseData,
                status: response.status
              }),
              {
                status: response.status,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
          
          console.log("Discord event created successfully with base64 image");
          
        } catch (imageError) {
          console.error("Error processing base64 image:", imageError);
          // Continuer sans image en cas d'erreur
          console.log("Continuing without image due to error");
        }
      } else {
        console.error("Unsupported image format, not a URL or data URL");
      }
    }
    
    // Si nous n'avons pas encore de réponse (image non traitée ou erreur lors du traitement),
    // envoyer la requête sans image
    if (!responseData) {
      console.log("Sending to Discord API without image");
      
      const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/scheduled-events`, {
        method: "POST",
        headers: {
          "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });
      
      // Récupérer la réponse
      responseData = await response.json();
      
      if (!response.ok) {
        console.error("Discord API error:", response.status, JSON.stringify(responseData));
        return new Response(
          JSON.stringify({ 
            error: "Failed to create Discord event", 
            details: responseData,
            status: response.status
          }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      console.log("Discord event created successfully without image");
    }
    
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
      JSON.stringify({ 
        error: error.message || "Une erreur est survenue",
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

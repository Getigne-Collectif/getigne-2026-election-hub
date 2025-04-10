
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
    let hasImage = false;
    
    // Fonction pour traiter les erreurs de l'API Discord
    const handleDiscordAPIError = async (response) => {
      const responseText = await response.text();
      console.error(`Discord API error: ${response.status} ${responseText}`);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create Discord event", 
          details: responseText,
          status: response.status
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    };
    
    // Essayer d'ajouter l'image si elle est fournie
    if (image && typeof image === 'string') {
      let imageBlob;
      
      try {
        // Si c'est une URL d'image
        if (image.startsWith('http') || image.startsWith('https')) {
          console.log("Processing image URL...");
          
          const imageResponse = await fetch(image);
          if (!imageResponse.ok) {
            console.error("Failed to fetch image from URL:", imageResponse.status);
            // Continuer sans image
          } else {
            const contentType = imageResponse.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
              imageBlob = await imageResponse.blob();
              hasImage = true;
            } else {
              console.error("URL does not point to an image, content-type:", contentType);
            }
          }
        } 
        // Si c'est une image base64
        else if (image.startsWith('data:image/')) {
          console.log("Processing base64 image...");
          
          const matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const [, mimeType, base64Data] = matches;
            
            if (mimeType.startsWith('image/')) {
              // Décoder le base64 et créer un blob
              const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
              imageBlob = new Blob([binaryData], { type: mimeType });
              hasImage = true;
            }
          } else {
            console.error("Invalid data URL format");
          }
        }
        
        // Vérifier la taille de l'image
        if (imageBlob && imageBlob.size > 8 * 1024 * 1024) {
          console.error("Image too large:", imageBlob.size, "bytes");
          hasImage = false;
          imageBlob = null;
        }
        
        // Si nous avons une image valide, créer l'événement avec l'image
        if (hasImage && imageBlob) {
          // Pour les événements avec image, nous devons envoyer la requête en deux parties
          // D'abord, envoyer les données JSON
          const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/scheduled-events`, {
            method: "POST",
            headers: {
              "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(eventData)
          });
          
          // Vérifier si l'événement a été créé avec succès
          if (!response.ok) {
            return handleDiscordAPIError(response);
          }
          
          responseData = await response.json();
          console.log("Discord event created successfully, now adding image...");
          
          // Ensuite, mettre à jour l'événement avec l'image
          const eventId = responseData.id;
          
          // Créer un FormData pour l'image
          const formData = new FormData();
          formData.append('image', imageBlob);
          
          // Mettre à jour l'événement avec l'image
          const imageUpdateResponse = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/scheduled-events/${eventId}`, {
            method: "PATCH",
            headers: {
              "Authorization": `Bot ${DISCORD_BOT_TOKEN}`
            },
            body: formData
          });
          
          if (!imageUpdateResponse.ok) {
            console.error("Failed to add image to the event, but event was created");
            // On continue car l'événement a déjà été créé
          } else {
            const updatedData = await imageUpdateResponse.json();
            responseData = updatedData;
            console.log("Image added to Discord event successfully");
          }
        }
      } catch (imageError) {
        console.error("Error processing image:", imageError);
        // Continuer sans image
      }
    }
    
    // Si nous n'avons pas traité l'image ou si le traitement a échoué, créer l'événement sans image
    if (!responseData) {
      console.log("Creating Discord event without image...");
      
      const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/scheduled-events`, {
        method: "POST",
        headers: {
          "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(eventData)
      });
      
      // Vérifier la réponse
      if (!response.ok) {
        return handleDiscordAPIError(response);
      }
      
      responseData = await response.json();
      console.log("Discord event created successfully without image");
    }
    
    // Retourner la réponse de succès
    return new Response(
      JSON.stringify({
        success: true,
        message: "Événement Discord créé avec succès" + (hasImage ? " avec image" : ""),
        event: responseData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
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
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuration CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeocodeRequest {
  address: string;
}

interface GeocodeResponse {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address }: GeocodeRequest = await req.json();

    if (!address || address.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "L'adresse est requise" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) {
      console.error("GOOGLE_MAPS_API_KEY n'est pas configuré");
      return new Response(
        JSON.stringify({ error: "Configuration de l'API manquante" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Erreur HTTP: ${response.status}` }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;

      const geocodeResponse: GeocodeResponse = {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: result.formatted_address,
      };

      return new Response(
        JSON.stringify(geocodeResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (data.status === "ZERO_RESULTS") {
      return new Response(
        JSON.stringify({ error: "Aucun résultat trouvé pour cette adresse" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (data.status === "REQUEST_DENIED") {
      console.error("Accès refusé à l'API:", data.error_message);
      return new Response(
        JSON.stringify({ 
          error: `Accès refusé: ${data.error_message || "Vérifiez la configuration de l'API key"}` 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (data.status === "OVER_QUERY_LIMIT") {
      return new Response(
        JSON.stringify({ error: "Quota de l'API Google Maps dépassé" }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      console.error("Erreur de géocodification:", data.status, data.error_message);
      return new Response(
        JSON.stringify({ 
          error: data.error_message || `Erreur: ${data.status}` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Erreur lors de la géocodification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur inconnue lors de la géocodification" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});


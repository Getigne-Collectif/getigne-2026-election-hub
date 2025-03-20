
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuration CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handle CORS preflight requests
serve(async (req) => {
  // Gestion des requêtes OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    
    if (!token) {
      // Try to get the token from the authorization header as a fallback
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        // Extract the token from the authorization header
        const headerToken = authHeader.substring(7);
        if (headerToken) {
          // Continue processing with the token from header
          return await processRequest(headerToken);
        }
      }
      
      return new Response(
        JSON.stringify({ error: "Token d'authentification manquant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return await processRequest(token);

  } catch (error) {
    console.error("Erreur inattendue:", error);
    return new Response(
      JSON.stringify({ error: "Une erreur est survenue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Extract the request processing logic into a separate function
async function processRequest(token) {
  // Décoder le token pour obtenir l'ID de l'utilisateur
  let userId;
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    userId = decoded.sub;
    console.log("User ID from token:", userId);
  } catch (error) {
    console.error("Erreur de décodage du token:", error);
    return new Response(
      JSON.stringify({ error: "Token invalide" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Initialisation du client Supabase
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Fetching registrations for user:", userId);
  
  // Récupération des événements auxquels l'utilisateur est inscrit
  const { data: registrations, error: registrationsError } = await supabase
    .from("event_registrations")
    .select("event_id")
    .eq("user_id", userId)
    .eq("status", "registered");

  if (registrationsError) {
    console.error("Erreur lors de la récupération des inscriptions:", registrationsError);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la récupération des inscriptions" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log("Found registrations:", registrations?.length || 0);

  if (!registrations || registrations.length === 0) {
    // Générer un calendrier vide si l'utilisateur n'est inscrit à aucun événement
    console.log("No registrations found, generating empty calendar");
    const emptyCalendar = generateICalendar([]);
    return new Response(emptyCalendar, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar",
        "Content-Disposition": "attachment; filename=mes-evenements.ics"
      }
    });
  }

  // Récupération des détails des événements
  const eventIds = registrations.map(reg => reg.event_id);
  console.log("Fetching events with IDs:", eventIds);
  
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .in("id", eventIds)
    .eq("status", "published");

  if (eventsError) {
    console.error("Erreur lors de la récupération des événements:", eventsError);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la récupération des événements" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log("Found events:", events?.length || 0);

  // Récupération du profil utilisateur pour personnaliser le calendrier
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("Erreur lors de la récupération du profil:", profileError);
  }

  // Génération du fichier iCalendar
  const calendarContent = generateICalendar(events, profile);

  // Renvoyer le contenu du calendrier
  return new Response(calendarContent, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/calendar",
      "Content-Disposition": "attachment; filename=mes-evenements.ics"
    }
  });
}

// Fonction pour générer le contenu iCalendar
function generateICalendar(events: any[], profile?: { first_name?: string; last_name?: string }) {
  const now = new Date();
  const timestamp = formatDate(now, true);
  const userName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Utilisateur';
  
  let icalContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gétigné Collectif//Agenda//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Événements Gétigné Collectif - ${userName}`,
    "X-WR-CALDESC:Événements auxquels vous êtes inscrit",
  ];

  // Ajouter chaque événement au calendrier
  events.forEach(event => {
    const eventDate = new Date(event.date);
    const uid = `event-${event.id}@getigne-collectif`;
    const startDate = formatDate(eventDate);
    
    // Estimer la durée de l'événement (par défaut: 2 heures)
    const endDate = formatDate(new Date(eventDate.getTime() + 2 * 60 * 60 * 1000));
    
    // Nettoyer la description (enlever le markup)
    let description = event.description || '';
    description = description.replace(/<[^>]*>/g, '');
    
    icalContent = icalContent.concat([
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location || 'À définir'}`,
      "END:VEVENT"
    ]);
  });

  icalContent.push("END:VCALENDAR");
  return icalContent.join("\r\n");
}

// Fonction pour formater les dates au format iCalendar
function formatDate(date: Date, withTime = true): string {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');

  if (withTime) {
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }
  return `${year}${month}${day}`;
}

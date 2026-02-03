import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAPROXY_URL = "https://www.maprocuration.gouv.fr";
const MAILJET_API_URL = "https://api.mailjet.com/v3.1/send";

interface Person {
  id: string;
  first_name: string;
  last_name: string;
  national_elector_number: string;
  phone: string;
  email: string;
}

interface RequestBody {
  matchId: string;
  requester: Person;
  volunteer: Person;
}

function buildPersonBlock(person: Person, title: string): string {
  return `
    <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #0369a1;">
      <h4 style="color: #0369a1; margin: 0 0 10px 0;">${title}</h4>
      <p style="margin: 5px 0;"><strong>Prénom :</strong> ${person.first_name}</p>
      <p style="margin: 5px 0;"><strong>Nom :</strong> ${person.last_name}</p>
      <p style="margin: 5px 0;"><strong>Numéro national d'électeur/électrice (NNE) :</strong> ${person.national_elector_number}</p>
      <p style="margin: 5px 0;"><strong>Téléphone :</strong> ${person.phone}</p>
      <p style="margin: 5px 0;"><strong>Email :</strong> <a href="mailto:${person.email}">${person.email}</a></p>
    </div>
  `;
}

function buildEmailToRequester(requester: Person, volunteer: Person): { subject: string; html: string } {
  const subject = `Procuration – Une personne a été trouvée pour voter à votre place`;
  const html = `
    <h2>Bonjour ${requester.first_name},</h2>
    
    <p>Nous avons trouvé une personne qui accepte de voter à votre place pour les élections municipales de Gétigné (15 mars 2026).</p>
    
    ${buildPersonBlock(volunteer, "Coordonnées de la personne qui votera pour vous (mandataire)")}
    
    <h3>Prochaine étape</h3>
    <p>Vous devez effectuer la démarche officielle sur le site du gouvernement :</p>
    <p><strong><a href="${MAPROXY_URL}">${MAPROXY_URL}</a></strong></p>
    <p>Vous y déclarerez cette personne comme mandataire en utilisant les informations ci-dessus (prénom, nom, NNE, téléphone, email).</p>
    
    <p><strong>Quand vous aurez terminé la procédure sur maprocuration.gouv.fr</strong>, merci de confirmer à la personne (par téléphone ou email) que la démarche est bien faite, afin qu'elle soit informée.</p>
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      Cet email a été envoyé automatiquement par Gétigné Collectif dans le cadre du dispositif de mise en relation pour les procurations.
    </p>
  `;
  return { subject, html };
}

function buildEmailToVolunteer(requester: Person, volunteer: Person): { subject: string; html: string } {
  const subject = `Procuration – Une personne vous a été assignée pour porter sa procuration`;
  const html = `
    <h2>Bonjour ${volunteer.first_name},</h2>
    
    <p>Une personne souhaite vous donner sa procuration pour les élections municipales de Gétigné (15 mars 2026). Voici ses coordonnées pour que vous puissiez échanger si besoin.</p>
    
    ${buildPersonBlock(requester, "Coordonnées de la personne qui vous donne sa procuration (mandant)")}
    
    <h3>Prochaine étape</h3>
    <p>Le mandant doit effectuer la démarche officielle sur le site du gouvernement :</p>
    <p><strong><a href="${MAPROXY_URL}">${MAPROXY_URL}</a></strong></p>
    <p>Il ou elle vous déclarera comme mandataire. <strong>Quand la procédure sera faite</strong>, le mandant vous contactera pour vous confirmer que tout est en ordre.</p>
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      Cet email a été envoyé automatiquement par Gétigné Collectif dans le cadre du dispositif de mise en relation pour les procurations.
    </p>
  `;
  return { subject, html };
}

async function sendEmail(
  apiKey: string,
  secretKey: string,
  fromEmail: string,
  fromName: string,
  toEmail: string,
  subject: string,
  html: string
): Promise<void> {
  const auth = btoa(`${apiKey}:${secretKey}`);
  const res = await fetch(MAILJET_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      Messages: [
        {
          From: { Email: fromEmail, Name: fromName },
          To: [{ Email: toEmail }],
          Subject: subject,
          HtmlPart: html,
        },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mailjet API error: ${res.status} ${err}`);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { requester, volunteer } = body;

    if (!requester?.email || !volunteer?.email) {
      throw new Error("requester and volunteer with email are required");
    }

    const mailjetApiKey = Deno.env.get("MAILJET_API_KEY");
    const mailjetSecretKey = Deno.env.get("MAILJET_SECRET_KEY");
    const fromEmail = Deno.env.get("PROXY_FROM_EMAIL") || Deno.env.get("CONTACT_EMAIL") || "procuration@getigne-collectif.fr";
    const fromName = "Gétigné Collectif";

    if (!mailjetApiKey || !mailjetSecretKey) {
      console.error("MAILJET_API_KEY or MAILJET_SECRET_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Email service not configured (MAILJET_API_KEY / MAILJET_SECRET_KEY)." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const toRequester = buildEmailToRequester(requester, volunteer);
    const toVolunteer = buildEmailToVolunteer(requester, volunteer);

    await sendEmail(
      mailjetApiKey,
      mailjetSecretKey,
      fromEmail,
      fromName,
      requester.email,
      toRequester.subject,
      toRequester.html
    );
    await sendEmail(
      mailjetApiKey,
      mailjetSecretKey,
      fromEmail,
      fromName,
      volunteer.email,
      toVolunteer.subject,
      toVolunteer.html
    );

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e: unknown) {
    console.error("proxy-match-notify error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

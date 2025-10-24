import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuration des variables d'environnement
const HELLO_ASSO_CLIENTID = Deno.env.get('HELLO_ASSO_CLIENTID');
const HELLO_ASSO_SECRET = Deno.env.get('HELLO_ASSO_SECRET');
const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID');
const DISCORD_MEMBER_ROLE_ID = Deno.env.get('DISCORD_MEMBER_ROLE_ID');
const DISCORD_INVITE_URL = Deno.env.get('DISCORD_INVITE_URL');
const MAILCHIMP_API_KEY = Deno.env.get('MAILCHIMP_API_KEY');
const MAILCHIMP_SERVER_PREFIX = Deno.env.get('MAILCHIMP_SERVER_PREFIX');
const MAILCHIMP_AUDIENCE_ID = Deno.env.get('MAILCHIMP_AUDIENCE_ID');
const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL');
const PUBLIC_URL = Deno.env.get('PUBLIC_URL') || 'https://getigne-collectif.fr';

// CORS headers pour les requêtes depuis HelloAsso
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interface pour les données HelloAsso
interface HelloAssoOrder {
  id: string;
  type: string;
  payer: {
    email: string;
    firstName: string;
    lastName: string;
  };
  items: Array<{
    name: string;
    type: string;
  }>;
  createdAt: string;
}

interface HelloAssoWebhookPayload {
  eventType: string;
  data: HelloAssoOrder;
}

// Fonction pour vérifier la signature HelloAsso (à implémenter selon leur documentation)
const verifyHelloAssoSignature = async (payload: string, signature: string): Promise<boolean> => {
  // TODO: Implémenter la vérification de signature selon la documentation HelloAsso
  // Pour l'instant, on accepte toutes les requêtes (à sécuriser en production)
  console.log("Signature verification:", signature);
  return true;
};

// Fonction pour stocker l'adhésion HelloAsso dans la base de données
const storeMembership = async (email: string, firstName: string, lastName: string, orderId: string): Promise<boolean> => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Vérifier si l'adhésion existe déjà
    const { data: existingMembership, error: checkError } = await supabaseAdmin
      .from('helloasso_memberships')
      .select('id')
      .eq('helloasso_order_id', orderId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error checking existing membership:", checkError);
      return false;
    }

    if (existingMembership) {
      console.log("Adhésion déjà enregistrée:", orderId);
      return true;
    }

    // Créer la nouvelle adhésion
    const { error: insertError } = await supabaseAdmin
      .from('helloasso_memberships')
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        helloasso_order_id: orderId,
        membership_type: 'standard'
      });

    if (insertError) {
      console.error("Error storing membership:", insertError);
      return false;
    }

    console.log("Adhésion HelloAsso stockée avec succès:", { email, orderId });
    return true;
  } catch (error) {
    console.error("Erreur lors du stockage de l'adhésion:", error);
    return false;
  }
};

// Fonction pour obtenir le lien d'invitation Discord générique
const getDiscordInviteLink = (): string => {
  // Utiliser un lien d'invitation Discord générique permanent
  const genericInviteLink = DISCORD_INVITE_URL || 'https://discord.gg/votre-lien-invitation';
  console.log("Utilisation du lien d'invitation Discord générique:", genericInviteLink);
  return genericInviteLink;
};

// Fonction pour ajouter l'adhérent à Mailchimp
const addToMailchimp = async (email: string, firstName: string, lastName: string): Promise<boolean> => {
  try {
    if (!MAILCHIMP_API_KEY || !MAILCHIMP_SERVER_PREFIX || !MAILCHIMP_AUDIENCE_ID) {
      console.error('Variables d\'environnement Mailchimp manquantes');
      return false;
    }

    const mailchimpUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`;
    
    const mailchimpData = {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: firstName || '',
        LNAME: lastName || '',
      },
      tags: ['helloasso_member'],
    };

    const response = await fetch(mailchimpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mailchimpData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Si l'email existe déjà dans Mailchimp, on considère que c'est un succès
      if (response.status === 400 && errorData.title === 'Member Exists') {
        console.log("L'email existe déjà dans Mailchimp");
        return true;
      }
      throw new Error(`Mailchimp API error: ${errorData.detail || errorData.title}`);
    }

    const result = await response.json();
    console.log("Email ajouté à Mailchimp:", result);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'ajout à Mailchimp:", error);
    return false;
  }
};

// Fonction pour créer le compte utilisateur
const createUserAccount = async (email: string, firstName: string, lastName: string): Promise<boolean> => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUsers, error: userCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email);

    if (userCheckError) {
      console.error("Error checking existing users:", userCheckError);
      return false;
    }

    // Si l'utilisateur existe déjà, mettre à jour le statut membre
    if (existingUsers && existingUsers.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ is_member: true })
        .eq('email', email);
      
      if (updateError) {
        console.error("Error updating existing user:", updateError);
        return false;
      }
      
      console.log("Utilisateur existant mis à jour avec le statut membre");
      return true;
    }

    // Créer un nouvel utilisateur
    const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name: firstName,
        last_name: lastName,
        is_member: true,
      },
      redirectTo: `${PUBLIC_URL}/auth/callback`
    });

    if (inviteError) {
      console.error("Error inviting user:", inviteError);
      return false;
    }

    // Mettre à jour le profil avec is_member = true
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ is_member: true })
      .eq('id', data.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Enregistrer dans la table invited_users
    await supabaseAdmin
      .from('invited_users')
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        status: 'invited'
      });

    console.log("Utilisateur créé avec succès:", data);
    return true;
  } catch (error) {
    console.error("Erreur lors de la création du compte utilisateur:", error);
    return false;
  }
};

// Fonction pour envoyer l'email de bienvenue via notification Discord
const sendWelcomeEmail = async (email: string, firstName: string, discordInviteUrl: string): Promise<boolean> => {
  try {
    // Envoyer une notification Discord pour l'adhésion
    if (DISCORD_WEBHOOK_URL) {
      const discordMessage = `
🎉 **Nouvelle adhésion HelloAsso !**

**Adhérent**: ${firstName}
**Email**: ${email}
**Lien Discord**: ${discordInviteUrl}

L'adhérent a été ajouté à Mailchimp, un compte utilisateur a été créé, et l'adhésion a été stockée pour attribution automatique du rôle Discord.
      `;

      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "Système HelloAsso",
          embeds: [
            {
              title: "🎉 Nouvelle adhésion",
              description: discordMessage,
              color: 0x00ff00, // Vert
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    console.log("Email de bienvenue envoyé (via notification Discord)");
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de bienvenue:", error);
    return false;
  }
};

serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier que la requête est bien un POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer la signature HelloAsso
    const signature = req.headers.get('X-HelloAsso-Signature') || '';
    
    // Lire le payload
    const payload = await req.text();
    
    // Vérifier la signature
    const isValidSignature = await verifyHelloAssoSignature(payload, signature);
    if (!isValidSignature) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parser le payload JSON
    let webhookData: HelloAssoWebhookPayload;
    try {
      webhookData = JSON.parse(payload);
    } catch (error) {
      console.error("Error parsing webhook payload:", error);
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Webhook HelloAsso reçu:", JSON.stringify(webhookData, null, 2));

    // Vérifier que c'est bien un événement de type Order (adhésion)
    if (webhookData.eventType !== 'Order') {
      console.log("Événement ignoré:", webhookData.eventType);
      return new Response(
        JSON.stringify({ message: "Event type ignored" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const order = webhookData.data;
    const { email, firstName, lastName } = order.payer;

    // Vérifier que c'est bien une adhésion (pas un don)
    const isMembership = order.items.some(item => 
      item.type === 'Membership' || item.name.toLowerCase().includes('adhésion')
    );

    if (!isMembership) {
      console.log("Commande ignorée (pas une adhésion):", order.items);
      return new Response(
        JSON.stringify({ message: "Not a membership order" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Traitement de l'adhésion pour ${firstName} ${lastName} (${email})`);

    // Obtenir le lien d'invitation Discord générique
    const discordInviteUrl = getDiscordInviteLink();

    // Exécuter toutes les tâches en parallèle
    const [mailchimpSuccess, userSuccess, membershipStored] = await Promise.all([
      addToMailchimp(email, firstName, lastName),
      createUserAccount(email, firstName, lastName),
      storeMembership(email, firstName, lastName, order.id),
    ]);

    // Envoyer l'email de bienvenue
    const emailSuccess = await sendWelcomeEmail(email, firstName, discordInviteUrl);

    // Résumé des résultats
    const results = {
      mailchimp: mailchimpSuccess,
      userAccount: userSuccess,
      membershipStored: membershipStored,
      discordInvite: discordInviteUrl,
      welcomeEmail: emailSuccess,
    };

    console.log("Résultats du traitement:", results);

    // Envoyer une notification Discord de succès ou d'erreur
    if (DISCORD_WEBHOOK_URL) {
      const allSuccess = mailchimpSuccess && userSuccess && membershipStored && emailSuccess;
      const discordMessage = `
**Résultat du traitement de l'adhésion HelloAsso**

**Adhérent**: ${firstName} ${lastName} (${email})
**Mailchimp**: ${mailchimpSuccess ? '✅' : '❌'}
**Compte utilisateur**: ${userSuccess ? '✅' : '❌'}
**Adhésion stockée**: ${membershipStored ? '✅' : '❌'}
**Email de bienvenue**: ${emailSuccess ? '✅' : '❌'}

**Lien Discord**: ${discordInviteUrl}

*L'adhérent recevra automatiquement le rôle "Adhérent" quand il rejoindra le serveur Discord.*
      `;

      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "Système HelloAsso",
          embeds: [
            {
              title: allSuccess ? "✅ Adhésion traitée avec succès" : "⚠️ Adhésion traitée avec des erreurs",
              description: discordMessage,
              color: allSuccess ? 0x00ff00 : 0xffaa00, // Vert ou orange
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Adhésion traitée avec succès",
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error processing HelloAsso webhook:", error);
    
    // Envoyer une notification Discord d'erreur
    if (DISCORD_WEBHOOK_URL) {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "Système HelloAsso",
          embeds: [
            {
              title: "❌ Erreur lors du traitement du webhook HelloAsso",
              description: `**Erreur**: ${error.message || 'Erreur inconnue'}`,
              color: 0xff0000, // Rouge
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    return new Response(
      JSON.stringify({ 
        error: error.message || "Une erreur est survenue lors du traitement du webhook" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
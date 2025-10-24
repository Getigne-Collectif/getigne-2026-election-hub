import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuration des variables d'environnement
const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID');
const DISCORD_MEMBER_ROLE_ID = Deno.env.get('DISCORD_MEMBER_ROLE_ID');
const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL');

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interface pour l'événement Discord member join
interface DiscordMemberJoinEvent {
  type: 'member_join';
  guild_id: string;
  user: {
    id: string;
    username: string;
    email?: string;
  };
}

// Fonction pour assigner le rôle "Adhérent" à un utilisateur Discord
const assignMemberRole = async (userId: string): Promise<boolean> => {
  try {
    if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID || !DISCORD_MEMBER_ROLE_ID) {
      console.error('Variables d\'environnement Discord manquantes');
      return false;
    }

    const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${DISCORD_MEMBER_ROLE_ID}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Erreur lors de l'assignation du rôle: ${response.status} - ${JSON.stringify(errorData)}`);
      return false;
    }

    console.log(`Rôle "Adhérent" assigné avec succès à l'utilisateur ${userId}`);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'assignation du rôle:", error);
    return false;
  }
};

// Fonction pour vérifier si un utilisateur Discord est un adhérent HelloAsso
const checkMembership = async (userId: string, username: string): Promise<{ isMember: boolean; email?: string }> => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Récupérer les informations de l'utilisateur Discord
    const discordUserResponse = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!discordUserResponse.ok) {
      console.error(`Erreur lors de la récupération des infos Discord: ${discordUserResponse.status}`);
      return { isMember: false };
    }

    const discordUser = await discordUserResponse.json();
    console.log(`Informations Discord pour ${username}:`, discordUser);

    // Vérifier si l'utilisateur a un email vérifié
    if (!discordUser.verified || !discordUser.email) {
      console.log(`Utilisateur ${username} n'a pas d'email vérifié`);
      return { isMember: false };
    }

    const email = discordUser.email;
    console.log(`Vérification de l'adhésion HelloAsso pour l'email: ${email}`);

    // Vérifier si cet email existe dans la table helloasso_memberships
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('helloasso_memberships')
      .select('*')
      .eq('email', email)
      .single();

    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error("Erreur lors de la vérification de l'adhésion:", membershipError);
      return { isMember: false };
    }

    if (!membership) {
      console.log(`Email ${email} non trouvé dans les adhésions HelloAsso`);
      return { isMember: false };
    }

    // Vérifier si le rôle Discord a déjà été assigné
    if (membership.discord_role_assigned) {
      console.log(`Rôle Discord déjà assigné pour ${email}`);
      return { isMember: true, email };
    }

    console.log(`Adhérent HelloAsso trouvé: ${email}`);
    return { isMember: true, email };
  } catch (error) {
    console.error("Erreur lors de la vérification de l'adhésion:", error);
    return { isMember: false };
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

    // Parser le payload JSON
    let eventData: DiscordMemberJoinEvent;
    try {
      eventData = await req.json();
    } catch (error) {
      console.error("Error parsing event payload:", error);
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Événement Discord reçu:", JSON.stringify(eventData, null, 2));

    // Vérifier que c'est bien un événement member_join
    if (eventData.type !== 'member_join') {
      console.log("Événement ignoré:", eventData.type);
      return new Response(
        JSON.stringify({ message: "Event type ignored" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { user } = eventData;
    console.log(`Nouveau membre Discord: ${user.username} (${user.id})`);

    // Vérifier si c'est un adhérent HelloAsso
    const { isMember, email } = await checkMembership(user.id, user.username);

    if (isMember && email) {
      // Assigner le rôle "Adhérent"
      const roleAssigned = await assignMemberRole(user.id);

      // Marquer l'adhésion comme traitée dans la base de données
      if (roleAssigned) {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        await supabaseAdmin
          .from('helloasso_memberships')
          .update({ 
            discord_user_id: user.id,
            discord_role_assigned: true,
            discord_role_assigned_at: new Date().toISOString()
          })
          .eq('email', email);
      }

      // Envoyer une notification Discord
      if (DISCORD_WEBHOOK_URL) {
        const discordMessage = `
🎉 **Nouvel adhérent HelloAsso sur Discord !**

**Utilisateur**: ${user.username} (${user.id})
**Email**: ${email}
**Rôle assigné**: ${roleAssigned ? '✅ Adhérent' : '❌ Erreur'}

L'adhérent HelloAsso a rejoint le serveur Discord et a reçu automatiquement le rôle "Adhérent".
        `;

        await fetch(DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "Système Discord",
            embeds: [
              {
                title: roleAssigned ? "✅ Nouvel adhérent Discord" : "⚠️ Erreur assignation rôle",
                description: discordMessage,
                color: roleAssigned ? 0x00ff00 : 0xffaa00, // Vert ou orange
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Membre traité avec succès",
          roleAssigned,
          user: {
            id: user.id,
            username: user.username
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      console.log(`Utilisateur ${user.username} n'est pas un adhérent HelloAsso`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Utilisateur non-adhérent ignoré",
          user: {
            id: user.id,
            username: user.username
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

  } catch (error) {
    console.error("Error processing Discord member join event:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Une erreur est survenue lors du traitement de l'événement Discord" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

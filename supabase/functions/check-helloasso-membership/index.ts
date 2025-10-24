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

// Interface pour la requête
interface CheckMembershipRequest {
  email: string;
  userId: string;
}

// Fonction pour trouver un utilisateur Discord par email (approximation)
const findDiscordUserByEmail = async (email: string): Promise<string | null> => {
  try {
    // Note: L'API Discord ne permet pas de rechercher par email directement
    // Cette fonction est un placeholder pour une future implémentation
    // Pour l'instant, on retourne null et on se concentre sur la promotion du statut membre
    console.log(`Recherche Discord pour l'email: ${email}`);
    return null;
  } catch (error) {
    console.error("Erreur lors de la recherche Discord:", error);
    return null;
  }
};

// Fonction pour assigner le rôle Discord à un utilisateur
const assignDiscordRole = async (discordUserId: string): Promise<boolean> => {
  try {
    if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID || !DISCORD_MEMBER_ROLE_ID) {
      console.error('Variables d\'environnement Discord manquantes');
      return false;
    }

    const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${DISCORD_MEMBER_ROLE_ID}`, {
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

    console.log(`Rôle "Adhérent" assigné avec succès à l'utilisateur Discord ${discordUserId}`);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'assignation du rôle Discord:", error);
    return false;
  }
};

// Fonction pour promouvoir un utilisateur au statut membre
const promoteToMember = async (userId: string, email: string): Promise<boolean> => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Mettre à jour le profil avec is_member = true
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ is_member: true })
      .eq('id', userId);

    if (profileError) {
      console.error("Error updating profile to member:", profileError);
      return false;
    }

    // Mettre à jour la table helloasso_memberships avec l'ID utilisateur
    const { error: membershipError } = await supabaseAdmin
      .from('helloasso_memberships')
      .update({ 
        discord_user_id: userId,
        discord_role_assigned: true,
        discord_role_assigned_at: new Date().toISOString()
      })
      .eq('email', email);

    if (membershipError) {
      console.error("Error updating membership record:", membershipError);
    }

    console.log(`Utilisateur ${email} promu au statut membre`);
    return true;
  } catch (error) {
    console.error("Erreur lors de la promotion au statut membre:", error);
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

    // Parser le payload JSON
    let requestData: CheckMembershipRequest;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error("Error parsing request payload:", error);
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { email, userId } = requestData;
    console.log(`Vérification HelloAsso pour: ${email} (${userId})`);

    // Vérifier si l'utilisateur est un adhérent HelloAsso
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('helloasso_memberships')
      .select('*')
      .eq('email', email)
      .single();

    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error("Error checking membership:", membershipError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!membership) {
      console.log(`Utilisateur ${email} n'est pas un adhérent HelloAsso`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          isMember: false,
          message: "Not a HelloAsso member"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Utilisateur ${email} est un adhérent HelloAsso`);

    // Vérifier si l'utilisateur a déjà été promu
    if (membership.discord_role_assigned) {
      console.log(`Utilisateur ${email} a déjà été promu`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          isMember: true,
          promoted: false,
          message: "Already promoted"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Promouvoir l'utilisateur au statut membre
    const promoted = await promoteToMember(userId, email);

    // Essayer de trouver et assigner le rôle Discord
    const discordUserId = await findDiscordUserByEmail(email);
    let discordRoleAssigned = false;
    
    if (discordUserId) {
      discordRoleAssigned = await assignDiscordRole(discordUserId);
    }

    // Envoyer une notification Discord
    if (DISCORD_WEBHOOK_URL) {
      const discordMessage = `
🎉 **Adhérent HelloAsso connecté !**

**Utilisateur**: ${email}
**Statut membre**: ${promoted ? '✅ Promu' : '❌ Erreur'}
**Rôle Discord**: ${discordRoleAssigned ? '✅ Assigné' : '⏳ En attente'}

L'utilisateur s'est connecté au site et a été promu au statut membre.
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
              title: promoted ? "✅ Adhérent promu" : "⚠️ Erreur promotion",
              description: discordMessage,
              color: promoted ? 0x00ff00 : 0xffaa00, // Vert ou orange
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        isMember: true,
        promoted,
        discordRoleAssigned,
        message: promoted ? "User promoted to member" : "Promotion failed"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error processing HelloAsso membership check:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Une erreur est survenue lors de la vérification de l'adhésion" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});


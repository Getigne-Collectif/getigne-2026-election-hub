
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  first_name: string;
  last_name: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupérer les données de la requête
    const requestData: InviteRequest = await req.json();
    const { email, first_name, last_name } = requestData;

    console.log("Invitation request:", requestData);

    // Créer un client Supabase avec les crédentials admin
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
      return new Response(
        JSON.stringify({ error: userCheckError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Si l'utilisateur existe déjà, retourner une erreur appropriée
    if (existingUsers && existingUsers.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: "Cet email est déjà associé à un compte existant."
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Générer le lien d'invitation
    const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name,
        last_name,
      },
      redirectTo: `${Deno.env.get("PUBLIC_URL") ?? "http://localhost:3000"}/auth/callback`
    });

    if (inviteError) {
      console.error("Error inviting user:", inviteError);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Invitation sent successfully:", data);

    // Mettre à jour le statut de l'invitation si elle existe déjà
    const { data: existingInvite, error: inviteCheckError } = await supabaseAdmin
      .from('invited_users')
      .select('id')
      .eq('email', email);

    if (!inviteCheckError && existingInvite && existingInvite.length > 0) {
      // Mettre à jour l'invitation existante
      await supabaseAdmin
        .from('invited_users')
        .update({ status: 'invited' })
        .eq('email', email);
    } else {
      // Créer une nouvelle entrée d'invitation
      await supabaseAdmin
        .from('invited_users')
        .insert({
          email,
          first_name,
          last_name,
          status: 'invited'
        });
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation envoyée avec succès" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur est survenue" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

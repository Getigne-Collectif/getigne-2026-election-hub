import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteUserRequest {
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupérer les données de la requête
    const requestData: DeleteUserRequest = await req.json();
    const { userId } = requestData;

    console.log("Delete user request:", requestData);

    // Créer un client Supabase avec les crédentials admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Vérifier si l'utilisateur existe
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error("Error fetching user:", userError);
      return new Response(
        JSON.stringify({ error: userError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!userData.user) {
      return new Response(
        JSON.stringify({ error: "Utilisateur non trouvé" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier que l'utilisateur est désactivé avant de le supprimer
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la vérification du profil utilisateur" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (profileData.status !== 'disabled') {
      return new Response(
        JSON.stringify({ error: "L'utilisateur doit être désactivé avant d'être supprimé" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Supprimer l'utilisateur de toutes les tables qui le référencent
    console.log("Suppression des données utilisateur...");

    // 1. Supprimer les rôles
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (rolesError) {
      console.error("Error deleting user roles:", rolesError);
      // Continuer même si cette étape échoue
    }

    // 2. Supprimer les commentaires
    const { error: commentsError } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('user_id', userId);

    if (commentsError) {
      console.error("Error deleting comments:", commentsError);
    }

    // 3. Supprimer les commentaires de programme
    const { error: programCommentsError } = await supabaseAdmin
      .from('program_comments')
      .delete()
      .eq('user_id', userId);

    if (programCommentsError) {
      console.error("Error deleting program comments:", programCommentsError);
    }

    // 4. Supprimer les enregistrements d'événements
    const { error: eventRegistrationsError } = await supabaseAdmin
      .from('event_registrations')
      .delete()
      .eq('user_id', userId);

    if (eventRegistrationsError) {
      console.error("Error deleting event registrations:", eventRegistrationsError);
    }

    // 5. Supprimer les likes de projets
    const { error: projectLikesError } = await supabaseAdmin
      .from('project_likes')
      .delete()
      .eq('user_id', userId);

    if (projectLikesError) {
      console.error("Error deleting project likes:", projectLikesError);
    }

    // 6. Supprimer les notifications
    const { error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (notificationsError) {
      console.error("Error deleting notifications:", notificationsError);
    }

    // 7. Mettre à jour les membres de comité qui référencent cet utilisateur
    const { error: committeeMembersError } = await supabaseAdmin
      .from('committee_members')
      .update({ user_id: null })
      .eq('user_id', userId);

    if (committeeMembersError) {
      console.error("Error updating committee members:", committeeMembersError);
    }

    // 8. Supprimer le profil
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      console.error("Error deleting profile:", profileDeleteError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la suppression du profil" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 9. Supprimer l'utilisateur de l'authentification Supabase
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("Error deleting user from auth:", authDeleteError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la suppression de l'utilisateur de l'authentification" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Utilisateur supprimé avec succès:", userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Utilisateur supprimé définitivement avec succès" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing user deletion:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur est survenue lors de la suppression" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

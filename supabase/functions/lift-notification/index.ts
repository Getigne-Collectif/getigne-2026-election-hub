
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface NotificationRequest {
  postId: string;
  senderId: string;
  message: string;
  postType: 'offer' | 'request';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId, senderId, message, postType }: NotificationRequest = await req.json();

    console.log('Processing lift notification:', { postId, senderId, postType });

    // Récupérer les informations du post
    const { data: post, error: postError } = await supabase
      .from('lift_posts')
      .select('*, user_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      throw new Error('Post not found');
    }

    // Récupérer les informations de l'expéditeur
    const { data: sender, error: senderError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', senderId)
      .single();

    if (senderError || !sender) {
      throw new Error('Sender not found');
    }

    // Récupérer les informations du propriétaire du post
    const { data: postOwner, error: ownerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', post.user_id)
      .single();

    if (ownerError || !postOwner) {
      throw new Error('Post owner not found');
    }

    // Préparer le contenu de l'email
    const isOffer = postType === 'offer';
    const actionText = isOffer ? 'est intéressé par votre trajet' : 'vous propose un covoiturage';
    const subject = `Lift - ${sender.first_name} ${actionText}`;

    const emailContent = `
      <h2>Bonjour ${postOwner.first_name},</h2>
      
      <p><strong>${sender.first_name} ${sender.last_name}</strong> ${actionText} :</p>
      
      <div style="background: #fff7ed; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
        <h3 style="color: #9a3412; margin: 0 0 10px 0;">
          ${post.departure_location} → ${post.arrival_location}
        </h3>
        <p style="margin: 5px 0;"><strong>Jour :</strong> ${post.day}</p>
        ${post.time_start ? `<p style="margin: 5px 0;"><strong>Heure :</strong> ${post.time_start}${post.time_end && post.is_flexible_time ? ` - ${post.time_end}` : ''}</p>` : ''}
        ${post.description ? `<p style="margin: 10px 0;"><strong>Description :</strong><br>${post.description.replace(/\n/g, '<br>')}</p>` : ''}
      </div>
      
      <h3>Message de ${sender.first_name} :</h3>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        ${message.replace(/\n/g, '<br>')}
      </div>
      
      <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #0369a1; margin: 0 0 10px 0;">Coordonnées de ${sender.first_name} :</h4>
        <p style="margin: 5px 0;"><strong>Nom :</strong> ${sender.first_name} ${sender.last_name}</p>
        ${sender.email ? `<p style="margin: 5px 0;"><strong>Email :</strong> <a href="mailto:${sender.email}">${sender.email}</a></p>` : ''}
      </div>
      
      <p>Vous pouvez maintenant prendre contact directement avec ${sender.first_name} pour organiser votre covoiturage.</p>
      
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        Cet email a été envoyé automatiquement depuis la plateforme Lift de Gétigné Collectif.
      </p>
    `;

    // Invoquer la fonction d'envoi d'email
    const { error: emailError } = await supabase.functions.invoke('contact-form', {
      body: {
        to: postOwner.email,
        subject: subject,
        html: emailContent
      }
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

    console.log('Email sent successfully to:', postOwner.email);

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent successfully' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in lift-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);

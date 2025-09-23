import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsletterSubscription {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, firstName, lastName, source }: NewsletterSubscription = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Configuration Mailchimp
    const apiKey = Deno.env.get('MAILCHIMP_API_KEY')
    const serverPrefix = Deno.env.get('MAILCHIMP_SERVER_PREFIX')
    const audienceId = Deno.env.get('MAILCHIMP_AUDIENCE_ID')

    console.log('Variables d\'environnement:', {
      apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined',
      serverPrefix: serverPrefix || 'undefined',
      audienceId: audienceId || 'undefined'
    })

    if (!apiKey || !serverPrefix || !audienceId) {
      throw new Error('Variables d\'environnement Mailchimp manquantes')
    }

    // Appel direct à l'API REST Mailchimp
    const mailchimpUrl = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members`
    console.log('URL Mailchimp:', mailchimpUrl)
    
    const mailchimpData = {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: firstName || '',
        LNAME: lastName || '',
      },
      tags: source ? [source] : [],
    }

    const mailchimpResponse = await fetch(mailchimpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mailchimpData),
    })

    if (!mailchimpResponse.ok) {
      const errorData = await mailchimpResponse.json()
      
      // Si l'email existe déjà dans Mailchimp, on considère que c'est un succès
      if (mailchimpResponse.status === 400 && errorData.title === 'Member Exists') {
        console.log("L'email existe déjà dans Mailchimp")
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Email déjà inscrit" 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      throw new Error(`Mailchimp API error: ${errorData.detail || errorData.title}`)
    }

    const mailchimpResult = await mailchimpResponse.json()
    console.log("Email ajouté à Mailchimp:", mailchimpResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        mailchimpId: mailchimpResult.id,
        message: 'Successfully subscribed to newsletter'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error("Erreur lors de l'inscription à la newsletter:", error)

    return new Response(
      JSON.stringify({ 
        error: `Erreur lors de l'inscription à la newsletter: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

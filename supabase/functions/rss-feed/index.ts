
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with admin privileges
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching published news articles for RSS feed");
    
    // Retrieve all published articles, ordered by date (most recent first)
    const { data: articles, error } = await supabase
      .from("news")
      .select(`
        *,
        news_categories(id, name)
      `)
      .eq("status", "published")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching news articles:", error);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve news articles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Retrieved ${articles.length} published articles`);

    // Get base URL for links
    const baseUrl = Deno.env.get("BASE_URL") || "https://getigne-collectif.fr";
    
    // Generate RSS XML
    const rssContent = generateRssFeed(articles, baseUrl);

    // Return RSS feed with appropriate headers
    return new Response(rssContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "max-age=3600"
      }
    });
  } catch (error) {
    console.error("Unexpected error generating RSS feed:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Function to generate RSS feed XML
function generateRssFeed(articles: any[], baseUrl: string): string {
  const now = new Date().toUTCString();
  
  // Start building the RSS XML
  let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Gétigné Collectif - Actualités</title>
    <link>${baseUrl}/actualites</link>
    <description>Suivez l'actualité de notre collectif, nos rencontres, et nos réflexions pour construire ensemble l'avenir de Gétigné.</description>
    <language>fr-fr</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/rss" rel="self" type="application/rss+xml" />
`;

  // Add each article as an item
  articles.forEach(article => {
    // Format the article date for RSS
    const pubDate = new Date(article.date).toUTCString();
    
    // Generate a proper article slug/URL
    const articleSlug = article.slug || article.id;
    const articleUrl = `${baseUrl}/actualites/${articleSlug}`;
    
    // Clean the content for XML (basic cleaning)
    const safeContent = article.content 
      ? article.content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;')
      : '';
    
    // Clean the title for XML
    const safeTitle = article.title
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    // Clean the excerpt for XML
    const safeExcerpt = article.excerpt
      ? article.excerpt
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;')
      : '';
      
    // Get category name
    const categoryName = article.news_categories?.name || article.category || 'Actualité';
    
    // Add item to RSS feed
    rss += `    <item>
      <title>${safeTitle}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${categoryName}</category>
      <description>${safeExcerpt}</description>
      <content:encoded><![CDATA[${article.content || ''}]]></content:encoded>
    </item>
`;
  });

  // Close the RSS XML
  rss += `  </channel>
</rss>`;

  return rss;
}

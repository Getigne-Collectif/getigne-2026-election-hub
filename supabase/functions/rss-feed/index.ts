
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    // Fetch published news articles
    const { data: articles, error } = await supabase
      .from("news")
      .select(`
        id, 
        title, 
        excerpt, 
        date, 
        slug,
        news_categories(name),
        news_to_tags(
          news_tags(name)
        )
      `)
      .eq("status", "published")
      .order("date", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching news for RSS:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare base URL for article links
    const baseUrl = supabaseUrl.replace(".supabase.co", "");
    const basePageUrl = `${baseUrl}/actualites`;

    // Start building RSS content
    let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Gétigné Collectif - Actualités</title>
  <description>Les dernières actualités de Gétigné Collectif</description>
  <link>${baseUrl}</link>
  <atom:link href="${supabaseUrl}/functions/v1/rss-feed" rel="self" type="application/rss+xml" />
  <language>fr-FR</language>
  <pubDate>${new Date().toUTCString()}</pubDate>
`;

    // Add items for each article
    for (const article of articles) {
      // Transformer les tags depuis la nouvelle structure many-to-many
      const tags = article.news_to_tags 
        ? article.news_to_tags.map((tag: any) => tag.news_tags.name).join(", ") 
        : "";
      
      const category = article.news_categories ? article.news_categories.name : "";
      const url = article.slug
        ? `${basePageUrl}/${article.slug}`
        : `${basePageUrl}/${article.id}`;

      rss += `
  <item>
    <title>${escapeXml(article.title)}</title>
    <description>${escapeXml(article.excerpt)}</description>
    <link>${url}</link>
    <guid>${url}</guid>
    <pubDate>${new Date(article.date).toUTCString()}</pubDate>
    ${category ? `<category>${escapeXml(category)}</category>` : ""}
    ${tags ? `<category>${escapeXml(tags)}</category>` : ""}
  </item>`;
    }

    // Close the RSS document
    rss += `
</channel>
</rss>`;

    return new Response(rss, {
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Error generating RSS feed:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

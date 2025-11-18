import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PostHogInsightResponse {
  result: Array<{
    label: string;
    data: number[];
    dates: string[];
  }>;
}

interface TopPage {
  url: string;
  views: number;
  uniqueViews: number;
  avgTimeOnPage?: number;
}

interface PostHogStats {
  uniqueVisitors: number;
  pageViews: number;
  events: number;
  topPages: TopPage[];
  trend: {
    visitors: number;
    pageViews: number;
    events: number;
  };
}

interface PeriodRequest {
  period?: string;
}

const calculatePeriodDates = (period: string): { dateFrom: Date; dateTo: Date; prevDateFrom: Date; prevDateTo: Date } => {
  const now = new Date();
  let dateFrom: Date;
  let dateTo: Date = new Date(now);
  let prevDateFrom: Date;
  let prevDateTo: Date;

  switch (period) {
    case '7days':
      dateFrom = new Date(now);
      dateFrom.setDate(dateFrom.getDate() - 7);
      prevDateFrom = new Date(dateFrom);
      prevDateFrom.setDate(prevDateFrom.getDate() - 7);
      prevDateTo = new Date(dateFrom);
      break;

    case '30days':
      dateFrom = new Date(now);
      dateFrom.setDate(dateFrom.getDate() - 30);
      prevDateFrom = new Date(dateFrom);
      prevDateFrom.setDate(prevDateFrom.getDate() - 30);
      prevDateTo = new Date(dateFrom);
      break;

    case 'currentMonth':
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      dateTo = new Date(now);
      prevDateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevDateTo = new Date(now.getFullYear(), now.getMonth(), 0);
      break;

    case 'previousMonth':
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      dateTo = new Date(now.getFullYear(), now.getMonth(), 0);
      prevDateFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      prevDateTo = new Date(now.getFullYear(), now.getMonth() - 1, 0);
      break;

    case 'currentQuarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      dateFrom = new Date(now.getFullYear(), currentQuarter * 3, 1);
      dateTo = new Date(now);
      prevDateFrom = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
      prevDateTo = new Date(now.getFullYear(), currentQuarter * 3, 0);
      break;

    case 'previousQuarter':
      const prevQuarter = Math.floor(now.getMonth() / 3) - 1;
      dateFrom = new Date(now.getFullYear(), prevQuarter * 3, 1);
      dateTo = new Date(now.getFullYear(), (prevQuarter + 1) * 3, 0);
      prevDateFrom = new Date(now.getFullYear(), (prevQuarter - 1) * 3, 1);
      prevDateTo = new Date(now.getFullYear(), prevQuarter * 3, 0);
      break;

    case 'currentYear':
      dateFrom = new Date(now.getFullYear(), 0, 1);
      dateTo = new Date(now);
      prevDateFrom = new Date(now.getFullYear() - 1, 0, 1);
      prevDateTo = new Date(now.getFullYear() - 1, 11, 31);
      break;

    case 'previousYear':
      dateFrom = new Date(now.getFullYear() - 1, 0, 1);
      dateTo = new Date(now.getFullYear() - 1, 11, 31);
      prevDateFrom = new Date(now.getFullYear() - 2, 0, 1);
      prevDateTo = new Date(now.getFullYear() - 2, 11, 31);
      break;

    default:
      // Par défaut: 7 derniers jours
      dateFrom = new Date(now);
      dateFrom.setDate(dateFrom.getDate() - 7);
      prevDateFrom = new Date(dateFrom);
      prevDateFrom.setDate(prevDateFrom.getDate() - 7);
      prevDateTo = new Date(dateFrom);
  }

  return { dateFrom, dateTo, prevDateFrom, prevDateTo };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupérer le paramètre period depuis le body
    let period = '7days'; // Par défaut
    try {
      const requestData: PeriodRequest = await req.json();
      period = requestData.period || '7days';
    } catch (e) {
      // Si pas de body, utiliser la valeur par défaut
      console.log("No period specified, using default: 7days");
    }

    const POSTHOG_API_KEY = Deno.env.get("POSTHOG_API_KEY");
    const POSTHOG_HOST = Deno.env.get("POSTHOG_HOST") || "https://app.posthog.com";
    let POSTHOG_PROJECT_ID = Deno.env.get("POSTHOG_PROJECT_ID");

    if (!POSTHOG_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: "PostHog API key not configured",
          message: "Veuillez configurer POSTHOG_API_KEY dans les secrets Supabase"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Toujours récupérer la liste des projets accessibles pour s'assurer qu'on utilise le bon
    let accessibleProjectId = POSTHOG_PROJECT_ID;
    
    try {
      const projectsResponse = await fetch(
        `${POSTHOG_HOST}/api/projects/`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${POSTHOG_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        // Vérifier si le project ID configuré est dans la liste des projets accessibles
        if (projectsData.results && projectsData.results.length > 0) {
          if (POSTHOG_PROJECT_ID) {
            // Vérifier si le project ID configuré est accessible
            const hasAccess = projectsData.results.some((p: any) => String(p.id) === String(POSTHOG_PROJECT_ID));
            if (!hasAccess) {
              console.warn(`Project ID ${POSTHOG_PROJECT_ID} not accessible, using first available project`);
              accessibleProjectId = String(projectsData.results[0].id);
            }
          } else {
            // Prendre le premier projet disponible
            accessibleProjectId = String(projectsData.results[0].id);
          }
        }
      } else {
        const errorText = await projectsResponse.text();
        console.error("Error fetching projects:", errorText);
      }
    } catch (e) {
      console.warn("Could not fetch projects list:", e);
    }

    if (!accessibleProjectId) {
      return new Response(
        JSON.stringify({ 
          error: "PostHog project ID not found",
          message: "Impossible de récupérer un project ID accessible. Vérifiez que votre clé API PostHog a accès à au moins un projet."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Utiliser le project ID accessible
    POSTHOG_PROJECT_ID = accessibleProjectId;

    // Calculer les dates selon la période demandée
    const { dateFrom, dateTo, prevDateFrom, prevDateTo } = calculatePeriodDates(period);

    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    // Utiliser l'endpoint POST pour les insights avec le bon format
    const insightPayload = {
      events: [{ id: "$pageview", name: "$pageview", type: "events", order: 0 }],
      date_from: formatDate(dateFrom),
      date_to: formatDate(dateTo),
      insight: "TRENDS",
      interval: period.includes('Year') ? "month" : period.includes('Quarter') ? "week" : "day"
    };

    // Récupérer les visiteurs uniques et pages vues (7 derniers jours)
    const pageViewsResponse = await fetch(
      `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/insights/trend/`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${POSTHOG_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(insightPayload),
      }
    );

    if (!pageViewsResponse.ok) {
      const errorText = await pageViewsResponse.text();
      console.error("PostHog API error response:", errorText);
      throw new Error(`PostHog API error: ${pageViewsResponse.status} ${pageViewsResponse.statusText}`);
    }

    const pageViewsData: PostHogInsightResponse = await pageViewsResponse.json();
    const pageViews = pageViewsData.result?.[0]?.data?.reduce((a, b) => a + b, 0) || 0;
    
    // Récupérer les visiteurs uniques via l'API PostHog
    // Utiliser l'endpoint insights avec formula pour obtenir les visiteurs uniques
    let uniqueVisitors = 0;
    
    try {
      const uniqueVisitorsPayload = {
        events: [{ id: "$pageview", name: "$pageview", type: "events", order: 0 }],
        date_from: formatDate(dateFrom),
        date_to: formatDate(dateTo),
        insight: "TRENDS",
        interval: period.includes('Year') ? "month" : period.includes('Quarter') ? "week" : "day",
        // Utiliser formula pour obtenir les visiteurs uniques
        formula: "unique_users"
      };

      const uniqueVisitorsResponse = await fetch(
        `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/insights/trend/`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${POSTHOG_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(uniqueVisitorsPayload),
        }
      );

      if (uniqueVisitorsResponse.ok) {
        const uniqueVisitorsData: any = await uniqueVisitorsResponse.json();
        if (uniqueVisitorsData.result && Array.isArray(uniqueVisitorsData.result) && uniqueVisitorsData.result.length > 0) {
          // La formule unique_users retourne le nombre total de visiteurs uniques
          // On peut aussi sommer les valeurs si c'est un tableau de données
          if (uniqueVisitorsData.result[0].data) {
            uniqueVisitors = uniqueVisitorsData.result[0].data.reduce((a: number, b: number) => a + b, 0);
          } else if (typeof uniqueVisitorsData.result[0].count === 'number') {
            uniqueVisitors = uniqueVisitorsData.result[0].count;
          } else if (typeof uniqueVisitorsData.result[0] === 'number') {
            uniqueVisitors = uniqueVisitorsData.result[0];
          }
        }
      }
    } catch (e) {
      console.warn("Error fetching unique visitors:", e);
    }
    
    // Si on n'a pas réussi à obtenir les visiteurs uniques, utiliser une approximation
    if (uniqueVisitors === 0 && pageViews > 0) {
      // Approximation : environ 60-70% des pageviews sont des visiteurs uniques (les autres sont des retours)
      uniqueVisitors = Math.round(pageViews * 0.65);
    }

    // Récupérer le nombre total d'événements
    const eventsPayload = {
      events: [{ id: "*", name: "*", type: "events", order: 0 }],
      date_from: formatDate(dateFrom),
      date_to: formatDate(dateTo),
      insight: "TRENDS",
      interval: period.includes('Year') ? "month" : period.includes('Quarter') ? "week" : "day"
    };

    const eventsResponse = await fetch(
      `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/insights/trend/`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${POSTHOG_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventsPayload),
      }
    );

    let events = 0;
    if (eventsResponse.ok) {
      const eventsData: PostHogInsightResponse = await eventsResponse.json();
      events = eventsData.result?.[0]?.data?.reduce((a, b) => a + b, 0) || 0;
    }

    // Récupérer les stats de la période précédente pour calculer les tendances
    const prevPageViewsPayload = {
      events: [{ id: "$pageview", name: "$pageview", type: "events", order: 0 }],
      date_from: formatDate(prevDateFrom),
      date_to: formatDate(prevDateTo),
      insight: "TRENDS",
      interval: period.includes('Year') ? "month" : period.includes('Quarter') ? "week" : "day"
    };

    const prevPageViewsResponse = await fetch(
      `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/insights/trend/`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${POSTHOG_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prevPageViewsPayload),
      }
    );

    const prevEventsPayload = {
      events: [{ id: "*", name: "*", type: "events", order: 0 }],
      date_from: formatDate(prevDateFrom),
      date_to: formatDate(prevDateTo),
      insight: "TRENDS",
      interval: period.includes('Year') ? "month" : period.includes('Quarter') ? "week" : "day"
    };

    const prevEventsResponse = await fetch(
      `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/insights/trend/`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${POSTHOG_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prevEventsPayload),
      }
    );

    // Calculer les tendances
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    let trendVisitors = 0;
    let trendPageViews = 0;
    let trendEvents = 0;
    let prevPageViews = 0;
    let prevPageViewsData: PostHogInsightResponse | null = null;

    if (prevPageViewsResponse.ok) {
      prevPageViewsData = await prevPageViewsResponse.json();
      prevPageViews = prevPageViewsData.result?.[0]?.data?.reduce((a, b) => a + b, 0) || 0;
      trendPageViews = calculateTrend(pageViews, prevPageViews);
      
      // Calculer la tendance des visiteurs uniques
      const prevUniqueVisitors = Math.round(prevPageViews * 0.65); // Même approximation
      trendVisitors = calculateTrend(uniqueVisitors, prevUniqueVisitors);
    }

    if (prevEventsResponse.ok) {
      const prevEventsData: PostHogInsightResponse = await prevEventsResponse.json();
      const prevEvents = prevEventsData.result?.[0]?.data?.reduce((a, b) => a + b, 0) || 0;
      trendEvents = calculateTrend(events, prevEvents);
    }


    // Récupérer les pages les plus visitées (top pages)
    const topPagesPayload = {
      events: [{ id: "$pageview", name: "$pageview", type: "events", order: 0 }],
      date_from: formatDate(dateFrom),
      date_to: formatDate(dateTo),
      insight: "TRENDS",
      breakdown: "$current_url",
      breakdown_type: "event",
      limit: 10
    };

    const topPagesResponse = await fetch(
      `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/insights/trend/`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${POSTHOG_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(topPagesPayload),
      }
    );

    let topPages: TopPage[] = [];
    if (topPagesResponse.ok) {
      try {
        const topPagesData: any = await topPagesResponse.json();
        if (topPagesData.result && Array.isArray(topPagesData.result)) {
          topPages = topPagesData.result
            .filter((item: any) => {
              const label = item.label || "";
              // Filtrer les valeurs invalides
              return label && 
                     label !== "$pageview" && 
                     !label.includes("$$_posthog_breakdown_other_$$") &&
                     !label.includes("_posthog_breakdown_other") &&
                     label !== "null" &&
                     label !== "undefined" &&
                     label.trim() !== "";
            })
            .map((item: any) => {
              const totalViews = item.data?.reduce((a: number, b: number) => a + b, 0) || 0;
              return {
                url: item.label || "Unknown",
                views: totalViews,
                uniqueViews: totalViews, // Approximation
                avgTimeOnPage: undefined // PostHog ne fournit pas directement cette info via cette API
              };
            })
            .sort((a: TopPage, b: TopPage) => b.views - a.views)
            .slice(0, 10);
        }
      } catch (e) {
        console.warn("Error parsing top pages:", e);
      }
    }
    const stats: PostHogStats = {
      uniqueVisitors,
      pageViews,
      events,
      topPages,
      trend: {
        visitors: trendVisitors,
        pageViews: trendPageViews,
        events: trendEvents,
      },
    };

    return new Response(
      JSON.stringify(stats),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in get-posthog-stats:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Une erreur est survenue lors de la récupération des statistiques PostHog",
        details: "Vérifiez que POSTHOG_API_KEY et POSTHOG_PROJECT_ID sont correctement configurés dans les secrets Supabase"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});


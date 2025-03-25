import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowRight,
  Newspaper,
  Calendar,
  Users,
  MessageSquare,
  LayoutGrid,
  Leaf,
  Lightbulb,
  Utensils,
  Bike,
  Music,
  Home,
  FileText
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList, 
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";

const committeeIconMap = {
  'Lightbulb': Lightbulb,
  'Bicycle': Bike,
  'Utensils': Utensils,
  'Music': Music,
  'Leaf': Leaf
};

const getIconColor = (icon: string) => {
  const colorMap = {
    'Lightbulb': 'bg-yellow-50 text-yellow-600 border-yellow-200',
    'Bicycle': 'bg-purple-50 text-purple-600 border-purple-200',
    'Utensils': 'bg-orange-50 text-orange-600 border-orange-200',
    'Music': 'bg-blue-50 text-blue-600 border-blue-200',
    'Leaf': 'bg-green-50 text-green-600 border-green-200'
  };

  return colorMap[icon] || 'bg-getigne-100 text-getigne-700 border-getigne-200';
};

interface PageWithHierarchy {
  id: string;
  title: string;
  slug: string;
  parent_id: string | null;
  fullPath: string;
  children?: PageWithHierarchy[];
  level: number;
}

const SiteMapPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const committeesQuery = useQuery({
    queryKey: ['citizen_committees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citizen_committees')
        .select('*')
        .order('title');

      if (error) throw error;
      return data;
    },
  });

  const newsQuery = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const pagesQuery = useQuery({
    queryKey: ['pages_sitemap'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('status', 'published')
        .order('title');

      if (error) throw error;
      
      return buildPageHierarchy(data);
    },
  });

  const buildPageHierarchy = (pages: any[]): PageWithHierarchy[] => {
    const pagesMap: Record<string, PageWithHierarchy> = {};
    
    pages.forEach(page => {
      pagesMap[page.id] = {
        ...page,
        children: [],
        level: 0,
        fullPath: `/pages/${page.slug}`
      };
    });
    
    const rootPages: PageWithHierarchy[] = [];
    
    pages.forEach(page => {
      if (page.parent_id && pagesMap[page.parent_id]) {
        const parent = pagesMap[page.parent_id];
        
        if (!parent.children) {
          parent.children = [];
        }
        
        pagesMap[page.id].level = parent.level + 1;
        pagesMap[page.id].fullPath = `${parent.fullPath}/${page.slug}`;
        
        parent.children.push(pagesMap[page.id]);
      } else {
        rootPages.push(pagesMap[page.id]);
      }
    });
    
    return rootPages;
  };

  const renderPage = (page: PageWithHierarchy) => {
    return (
      <React.Fragment key={page.id}>
        <Link
          to={page.fullPath}
          className="p-6 bg-white rounded-lg border border-getigne-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
        >
          <div className="mt-1 bg-getigne-50 p-2 rounded-full">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-getigne-900 mb-2">{page.title}</h3>
            <p className="text-getigne-700">
              {page.children && page.children.length > 0 
                ? `Page contenant ${page.children.length} sous-page${page.children.length > 1 ? 's' : ''}`
                : 'Page simple'}
            </p>
          </div>
        </Link>
        
        {page.children && page.children.length > 0 && (
          <div className="ml-8 mt-4 grid gap-4">
            {page.children.map(childPage => renderPage(childPage))}
          </div>
        )}
      </React.Fragment>
    );
  };

  const mainPages = [
    {
      title: 'Accueil',
      path: '/',
      description: 'Page d\'accueil du site Gétigné Collectif',
      icon: <Home className="h-5 w-5" />
    },
    {
      title: 'Programme',
      path: '/programme',
      description: 'Notre programme pour les élections municipales',
      icon: <LayoutGrid className="h-5 w-5" />
    },
    {
      title: 'Actualités',
      path: '/actualites',
      description: 'Les dernières actualités du collectif',
      icon: <Newspaper className="h-5 w-5" />
    },
    {
      title: 'Événements',
      path: '/agenda/evenement',
      description: 'Nos événements et rencontres à venir',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      title: 'Notre équipe',
      path: '/equipe',
      description: 'Les membres qui composent notre collectif',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Commissions',
      path: '/commissions',
      description: 'Les commissions citoyennes et leurs travaux',
      icon: <MessageSquare className="h-5 w-5" />
    },
    {
      title: 'Contact',
      path: '/contact',
      description: 'Formulaire pour nous contacter',
      icon: <MessageSquare className="h-5 w-5" />
    },
    {
      title: 'Plan du site',
      path: '/plan-du-site',
      description: 'Structure et organisation du site',
      icon: <LayoutGrid className="h-5 w-5" />
    }
  ];

  const dynamicPagesSection = (
    <section>
      <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-getigne-100">
        Pages du site
      </h2>
      <div className="space-y-6">
        {pagesQuery.isLoading ? (
          <div className="text-center py-6">Chargement des pages...</div>
        ) : pagesQuery.error ? (
          <div className="text-center py-6 text-red-500">
            Erreur lors du chargement des pages
          </div>
        ) : pagesQuery.data?.length === 0 ? (
          <div className="text-center py-6 text-getigne-700">
            Aucune page disponible pour le moment
          </div>
        ) : (
          <div className="grid gap-6">
            {pagesQuery.data?.map(page => renderPage(page))}
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="page-content">
      <Navbar />
      <div className="pt-20">
        <div className="container mx-auto px-4 pt-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">
                  <Home className="h-4 w-4 mr-1" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Plan du site</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-8">Plan du site</h1>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-getigne-100">
                Pages principales
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {mainPages.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="p-6 bg-white rounded-lg border border-getigne-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
                  >
                    <div className="mt-1 bg-getigne-50 p-2 rounded-full">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-getigne-900 mb-2">{item.title}</h3>
                      <p className="text-getigne-700">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {dynamicPagesSection}

            <section>
              <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-getigne-100">
                Commissions citoyennes
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {committeesQuery.isLoading ? (
                  <div className="col-span-3 text-center py-6">Chargement des commissions...</div>
                ) : committeesQuery.error ? (
                  <div className="col-span-3 text-center py-6 text-red-500">
                    Erreur lors du chargement des commissions
                  </div>
                ) : (
                  committeesQuery.data?.map((committee) => {
                    const IconComponent = committeeIconMap[committee.icon] || Leaf;
                    const colorClass = getIconColor(committee.icon);

                    return (
                      <Link
                        key={committee.id}
                        to={`/commissions/${committee.id}`}
                        className="p-6 bg-white rounded-lg border border-getigne-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
                      >
                        <div className={`mt-1 p-2 rounded-full ${colorClass}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-getigne-900 mb-2">{committee.title}</h3>
                          <p className="text-getigne-700 line-clamp-2">{committee.description}</p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-getigne-100">
                Dernières actualités
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {newsQuery.isLoading ? (
                  <div className="col-span-3 text-center py-6">Chargement des actualités...</div>
                ) : newsQuery.error ? (
                  <div className="col-span-3 text-center py-6 text-red-500">
                    Erreur lors du chargement des actualités
                  </div>
                ) : newsQuery.data?.length === 0 ? (
                  <div className="col-span-3 text-center py-6 text-getigne-700">
                    Aucune actualité disponible pour le moment
                  </div>
                ) : (
                  newsQuery.data?.map((news) => (
                    <Link
                      key={news.id}
                      to={`/actualites/${news.id}`}
                      className="p-6 bg-white rounded-lg border border-getigne-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="mb-4 h-40 rounded-md overflow-hidden">
                        <img
                          src={news.image}
                          alt={news.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-sm text-getigne-500">
                          {new Date(news.date).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <h3 className="text-xl font-semibold text-getigne-900 mb-2">{news.title}</h3>
                        <p className="text-getigne-700 line-clamp-2">{news.excerpt}</p>
                      </div>
                    </Link>
                  ))
                )}

                <Link
                  to="/actualites"
                  className="col-span-full flex items-center justify-center text-getigne-accent hover:text-getigne-accent/80 font-medium mt-2"
                >
                  Voir toutes les actualités
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-getigne-100">
                Événements à venir
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {eventsQuery.isLoading ? (
                  <div className="col-span-3 text-center py-6">Chargement des événements...</div>
                ) : eventsQuery.error ? (
                  <div className="col-span-3 text-center py-6 text-red-500">
                    Erreur lors du chargement des événements
                  </div>
                ) : eventsQuery.data?.length === 0 ? (
                  <div className="col-span-3 text-center py-6 text-getigne-700">
                    Aucun événement à venir pour le moment
                  </div>
                ) : (
                  eventsQuery.data?.map((event) => (
                    <Link
                      key={event.id}
                      to={`/agenda/${event.id}`}
                      className="p-6 bg-white rounded-lg border border-getigne-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="mb-4 h-40 rounded-md overflow-hidden">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-sm text-getigne-500">
                          {new Date(event.date).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <h3 className="text-xl font-semibold text-getigne-900 mb-2">{event.title}</h3>
                        <p className="text-getigne-700 line-clamp-2">{event.description}</p>
                      </div>
                    </Link>
                  ))
                )}

                <Link
                  to="/agenda/evenement"
                  className="col-span-full flex items-center justify-center text-getigne-accent hover:text-getigne-accent/80 font-medium mt-2"
                >
                  Voir tous les événements
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SiteMapPage;

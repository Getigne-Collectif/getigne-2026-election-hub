
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
  Home
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";

// Map for committee icons
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

const SiteMapPage = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch committees for detailed sitemap
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

  // Fetch news for detailed sitemap
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

  // Fetch events for detailed sitemap
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
      path: '/evenements',
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

  return (
    <div className="page-content">
      <Navbar />
      <div className="pt-20">
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
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-8">Plan du site</h1>

          <div className="space-y-12">
            {/* Main Pages */}
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

            {/* Commissions */}
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

            {/* Latest News */}
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

            {/* Upcoming Events */}
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
                      to={`/evenements/${event.id}`}
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
                  to="/evenements"
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

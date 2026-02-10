
import React, { useState, useEffect, useRef } from 'react';
import {Calendar, MapPin, Clock, Users, ChevronRight, Home, Coffee, Filter} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Lightbulb, Bike, Utensils, Music, Leaf } from 'lucide-react';
import CalendarSync from '@/components/events/CalendarSync';
import { useAuth } from '@/context/auth';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";

// Map committee names to colors
const committeeColors = {
  "Environnement": "border-primary",
  "Mobilité": "border-getigne-accent",
  "Solidarité": "border-getigne-700",
  "Culture": "border-[#9b87f5]",
  "Économie": "border-[#0EA5E9]",
  "Éducation": "border-[#F97316]",
};

// Map for the committee icons
const iconMap = {
  'Lightbulb': Lightbulb,
  'Bicycle': Bike,
  'Utensils': Utensils,
  'Music': Music,
  'Leaf': Leaf,
};

const EventCard = ({ event, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [committeeColor, setCommitteeColor] = useState("");
  const [committeeIcon, setCommitteeIcon] = useState(null);
  const [committeeData, setCommitteeData] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  useEffect(() => {
    // Set committee color if applicable
    const fetchCommitteeInfo = async () => {
      if (event.committee_id) {
        try {
          const { data, error } = await supabase
            .from('citizen_committees')
            .select('*')
            .eq('id', event.committee_id)
            .single();

          if (!error && data) {
            const color = committeeColors[data.title] || "border-getigne-100";
            setCommitteeColor(color);
            setCommitteeData(data);

            // Set the icon component
            const IconComponent = iconMap[data.icon];
            setCommitteeIcon(IconComponent || Users);
          }
        } catch (error) {
          console.error('Error fetching committee:', error);
        }
      }
    };

    fetchCommitteeInfo();
  }, [event.committee_id]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const borderClass = committeeColor ? `border-2 ${committeeColor}` : "border border-getigne-100";
  const IconComponent = committeeIcon || Users;
  
  // Utiliser le slug s'il existe, sinon utiliser l'ID
  const eventUrl = event.slug ? `/agenda/${event.slug}` : `/agenda/${event.id}`;

  return (
    <Link to={eventUrl} className="block hover:no-underline">
      <div
        ref={ref}
        className={`bg-white rounded-xl overflow-hidden shadow-sm ${borderClass} hover-lift ${
          isVisible 
            ? 'opacity-100 translate-y-0 transition-all duration-700 ease-out' 
            : 'opacity-0 translate-y-10'
        }`}
        style={{ transitionDelay: `${index * 100}ms` }}
      >
        <div className="h-48 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {committeeData && (
              <div className={`flex items-center text-sm px-3 py-1 rounded-full ${committeeColor ? committeeColor.replace('border', 'bg').replace('getigne', 'getigne') : 'bg-getigne-50'} text-getigne-700`}>
                <IconComponent size={14} className="mr-1" />
                <span>Commission {committeeData.title}</span>
              </div>
            )}
          </div>

          <h3 className="font-medium text-xl mb-4">{event.title}</h3>

          <div className="flex items-center gap-2 text-getigne-700 mb-2">
            <Calendar size={16} className="text-getigne-accent" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-getigne-700 mb-2">
            <Clock size={16} className="text-getigne-accent" />
            <span>{formatTime(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-getigne-700 mb-4">
            <MapPin size={16} className="text-getigne-accent" />
            <span>{event.location}</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {event.is_members_only && (
              <div className="bg-getigne-50 text-getigne-700 px-3 py-1 rounded-full text-xs inline-flex items-center">
                <Users size={12} className="mr-1" />
                Réservé aux adhérents
              </div>
            )}
            {event.event_type === 'neighborhood' && (
              <div className="bg-getigne-accent/10 text-getigne-accent px-3 py-1 rounded-full text-xs inline-flex items-center">
                <Coffee size={12} className="mr-1" />
                Café de quartier
              </div>
            )}
          </div>

          <div className="text-getigne-accent flex items-center text-sm font-medium group mt-4">
            En savoir plus
            <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
};

const AgendaPage = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNeighborhoodEvents, setShowNeighborhoodEvents] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'published')
          .order('date', { ascending: true });

        if (error) throw error;

        const now = new Date();

        // Split events into upcoming and past
        const upcoming = [];
        const past = [];

        data.forEach(event => {
          const eventDate = new Date(event.date);
          if (eventDate >= now) {
            upcoming.push(event);
          } else {
            past.push(event);
          }
        });

        // Sort past events in descending order (most recent first)
        past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setUpcomingEvents(upcoming);
        setPastEvents(past);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des événements:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events based on the neighborhood events toggle
  const filterEvents = (events) => {
    if (!showNeighborhoodEvents) {
      return events.filter(event => event.event_type !== 'neighborhood');
    }
    return events;
  };

  const filteredUpcomingEvents = filterEvents(upcomingEvents);
  const filteredPastEvents = filterEvents(pastEvents);

  return (
    <HelmetProvider>
      <Helmet>
        <title>Agenda | Gétigné Collectif</title>
        <meta
          name="description"
          content="Retrouvez tous les événements à venir de Gétigné Collectif, réunions publiques, ateliers participatifs et moments d'échanges."
        />
      </Helmet>
      
      <div className="min-h-screen">
        <Navbar />

        <div>
          {/* Header */}
          <div className="pt-24 pb-12 bg-getigne-50">
            <div className="container mx-auto px-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">
                      <Home className="h-4 w-4 mr-1" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Agenda</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="max-w-3xl mx-auto text-center">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                    Agenda
                  </span>
                  <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Nos prochains événements</h1>
                  <p className="text-getigne-700 text-lg mb-6">
                    Retrouvez toutes nos réunions publiques, ateliers participatifs et moments d'échanges
                    pour construire ensemble l'avenir de Gétigné.
                  </p>
                  
                  {user && (
                    <div className="flex justify-center mt-4">
                      <CalendarSync />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Filter section */}
            <div className="border-t border-getigne-100 pt-8">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <Filter className="w-5 h-5 text-getigne-700" />
                          <span className="font-medium text-getigne-900">Filtres</span>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="neighborhood-events"
                              checked={showNeighborhoodEvents}
                              onCheckedChange={(checked) => setShowNeighborhoodEvents(checked === true)}
                            />
                            <label
                              htmlFor="neighborhood-events"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center"
                            >
                              <Coffee className="w-4 h-4 mr-1 text-getigne-accent" />
                              Voir les cafés de quartier
                            </label>
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <Link to="/cafes-de-quartier">
                              Découvrir les cafés de quartier
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Events content */}
          <main className="flex-grow py-16">
            <div className="container mx-auto px-4">
            {loading ? (
              <div className="text-center py-8">Chargement des événements...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">Une erreur est survenue: {error}</div>
            ) : (
              <>
                {filteredUpcomingEvents.length > 0 ? (
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {filteredUpcomingEvents.map((event, index) => (
                      <EventCard key={event.id} event={event} index={index} />
                    ))}
                  </div>
                ) : !showNeighborhoodEvents ? (
                  <div className="text-center py-8 bg-getigne-50 rounded-lg">
                    <h3 className="text-xl font-medium mb-2">Aucun événement à venir</h3>
                    <p className="text-getigne-700 mb-4">Revenez bientôt pour découvrir nos futurs événements</p>
                    <p className="text-sm text-getigne-600">
                      💡 Cochez "Voir les cafés de quartier" pour découvrir les rencontres de voisinage
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-getigne-50 rounded-lg">
                    <Coffee className="w-12 h-12 mx-auto mb-4 text-getigne-300" />
                    <h3 className="text-xl font-medium mb-2">Aucun Café de quartier à venir</h3>
                    <p className="text-getigne-700 mb-4">
                      Les prochaines rencontres de voisinage seront bientôt programmées
                    </p>
                    <Button asChild variant="outline">
                      <Link to="/cafes-de-quartier">
                        Organiser un Café de quartier
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Past Events Section */}
            {!loading && !error && filteredPastEvents.length > 0 && (
              <div className="mt-24">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <span className="bg-getigne-700/10 text-getigne-700 font-medium px-4 py-1 rounded-full text-sm">
                    Historique
                  </span>
                  <h2 className="text-3xl font-bold mt-4 mb-6">Événements passés</h2>
                  <p className="text-getigne-700 text-lg">
                    Découvrez les événements que nous avons organisés récemment.
                  </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPastEvents.map((event, index) => (
                    <EventCard key={event.id} event={event} index={index} />
                  ))}
                </div>
              </div>
            )}
          </div>
          </main>
        </div>
        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default AgendaPage;

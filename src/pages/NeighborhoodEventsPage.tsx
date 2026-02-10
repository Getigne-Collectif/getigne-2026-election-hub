import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Calendar, MapPin, Clock, Users, ChevronRight, Home, Coffee, Package, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import NeighborhoodEventsMap from '@/components/maps/NeighborhoodEventsMap';
import { generateRoutes } from '@/routes';
import { useAppSettings } from '@/hooks/useAppSettings';

interface NeighborhoodEvent {
  id: string;
  title: string;
  description: string;
  content?: string;
  date: string;
  location: string;
  image: string;
  latitude?: number;
  longitude?: number;
  organizer_name?: string;
  organizer_contact?: string;
  kit_provided?: boolean;
  member_present?: boolean;
  slug?: string;
  status?: string;
  event_type?: string;
  max_participants?: number;
}

const NeighborhoodEventsPage = () => {
  const { settings } = useAppSettings();
  const [events, setEvents] = useState<NeighborhoodEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<NeighborhoodEvent | null>(null);
  const [showPastOnMap, setShowPastOnMap] = useState(false);
  const [isPastEventsOpen, setIsPastEventsOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchNeighborhoodEvents();
  }, []);

  const fetchNeighborhoodEvents = async () => {
    try {
      console.log('[NeighborhoodEvents] Fetching neighborhood events...');
      
      // Récupérer tous les événements de voisinage (passés et futurs)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_type', 'neighborhood')
        .eq('status', 'published')
        .order('date', { ascending: true }); // Plus récents en premier

      console.log('[NeighborhoodEvents] Neighborhood events query result:', { data, error });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des cafés de quartier:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "PPPP", { locale: fr });
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), "HH'h'mm", { locale: fr });
  };

  const isPastEvent = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  const getEventUrl = (event: NeighborhoodEvent) => {
    return event.slug ? generateRoutes.eventDetail(event.slug) : generateRoutes.eventDetail(event.id);
  };

  const handleEventClick = (event: NeighborhoodEvent) => {
    setSelectedEvent(selectedEvent?.id === event.id ? null : event);
  };

  // Séparer les événements futurs et passés
  const futureEvents = events.filter(event => !isPastEvent(event.date));
  const pastEvents = events.filter(event => isPastEvent(event.date));

  // Events à afficher sur la carte
  const mapEvents = showPastOnMap ? events : futureEvents;

  // Composant pour afficher une carte d'événement
  const EventCard = ({ event, isPast = false }: { event: NeighborhoodEvent; isPast?: boolean }) => (
    <Card className={`hover:shadow-md transition-shadow ${isPast ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{event.title}</CardTitle>
              {isPast && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Terminé
                </span>
              )}
            </div>
            <CardDescription className="mt-1">
              {event.organizer_name && `Organisé par ${event.organizer_name}`}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEventClick(event)}
            className="ml-2"
          >
            {selectedEvent?.id === event.id ? 'Moins' : 'Plus'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-brand-700">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-brand" />
            <span className={isPast ? 'line-through text-gray-500' : ''}>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-brand" />
            <span className={isPast ? 'line-through text-gray-500' : ''}>{formatTime(event.date)}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-brand" />
            <span>{event.location}</span>
          </div>
        </div>

        {selectedEvent?.id === event.id && (
          <div className="mt-4 pt-4 border-t border-brand-100">
            <p className="text-brand-700 mb-4">{event.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {event.kit_provided && (
                <span className="bg-brand/10 text-brand px-2 py-1 rounded-full text-xs flex items-center">
                  <Package className="w-3 h-3 mr-1" />
                  Kit fourni
                </span>
              )}
              {event.member_present && (
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs flex items-center">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Membre présent
                </span>
              )}
              {event.max_participants && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  Max {event.max_participants} participants
                </span>
              )}
            </div>

            <Button asChild variant="outline" size="sm">
              <Link to={getEventUrl(event)}>
                Voir les détails
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const mapCenter = settings.map.center;
  const mapZoom = settings.map.zoom;

  return (
    <HelmetProvider>
      <Helmet>
        <title>Cafés de quartier | Gétigné Collectif</title>
        <meta
          name="description"
          content="Organisez ou participez à des cafés de quartier dans votre voisinage. Des rencontres conviviales pour échanger et construire ensemble l'avenir de Gétigné."
        />
      </Helmet>
      
      <div className="min-h-screen bg-white">
        <Navbar />
        
        <main className="pt-20">
          {/* En-tête avec breadcrumb et hero coloré */}
          <section className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-brand-50 py-8 overflow-hidden">
            {/* Éléments décoratifs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-200/20 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="container mx-auto px-4 relative">
              <Breadcrumb className="mb-6">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/" className="flex items-center">
                        <Home className="w-4 h-4 mr-1" />
                        Accueil
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/agenda" className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Agenda
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="flex items-center">
                      <Coffee className="w-4 h-4 mr-1" />
                      Cafés de quartier
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium">
                    <Coffee className="w-4 h-4 mr-2" />
                    Rencontres de voisinage
                  </div>
                  
                  <h1 className="text-5xl font-bold text-brand-900 leading-tight">
                    Cafés de 
                    <span className="text-amber-600"> quartier</span>
                  </h1>
                  
                  <p className="text-xl text-brand-700 leading-relaxed">
                    Des moments <span className="font-semibold text-amber-700">conviviaux</span> pour se retrouver, 
                    échanger et construire ensemble l'avenir de notre commune.
                  </p>
                  
                  <div className="flex flex-wrap gap-4 pt-4">
                    <div className="flex items-center text-brand-600">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                      <span className="text-sm">Rencontres chez l'habitant</span>
                    </div>
                    <div className="flex items-center text-brand-600">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                      <span className="text-sm">Ambiance décontractée</span>
                    </div>
                    <div className="flex items-center text-brand-600">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                      <span className="text-sm">Échanges constructifs</span>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <img 
                      src={settings.branding.images.neighborhood}
                      alt={`Places de ${settings.branding.city}`} 
                      className="w-full h-80 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4">
                        <p className="text-sm font-medium text-brand-900">
                          ☕ Prochaine rencontre dans votre quartier ?
                        </p>
                        <p className="text-xs text-brand-600 mt-1">
                          Organisez la vôtre ou rejoignez vos voisins
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Éléments décoratifs flottants */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-amber-400 rounded-full opacity-80"></div>
                  <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-orange-300 rounded-full opacity-60"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Section du concept */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-brand-900 mb-6">
                        Le concept des cafés de quartier
                      </h2>
                      <div className="space-y-4 text-brand-700 text-lg leading-relaxed">
                        <p>
                          Les cafés de quartier sont des <span className="font-semibold text-amber-700">rencontres informelles</span> organisées par et pour les habitants 
                          de Gétigné. L'objectif ? Créer du lien social, échanger sur la vie locale et imaginer 
                          ensemble des solutions pour notre commune.
                        </p>
                        <p>
                          Que vous souhaitiez organiser une rencontre dans votre jardin, votre salon ou un lieu 
                          public, nous vous accompagnons avec un kit d'organisation et la présence d'un membre 
                          du collectif.
                        </p>
                      </div>
                    </div>
                    
                    {/* Call-to-action */}
                    <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-6 border border-amber-200">
                      <h4 className="font-semibold text-amber-900 mb-2 flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        Envie de vous lancer ?
                      </h4>
                      <p className="text-amber-800 text-sm mb-4">
                        Contactez-nous pour planifier votre Café de quartier et recevoir votre kit
                      </p>
                      <Link 
                        to="/contact?type=organizer&subject=Je%20souhaite%20organiser%20un%20caf%C3%A9%20de%20quartier%20chez%20moi" 
                        className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Coffee className="w-4 h-4 mr-2" />
                        Organiser un café
                      </Link>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100">
                    <h3 className="text-xl font-semibold text-brand-900 mb-6 flex items-center">
                      <Package className="w-6 h-6 mr-3 text-amber-600" />
                      Ce qui vous attend
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start bg-white/60 rounded-lg p-4">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                          <Package className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-brand-900 mb-1">Kit d'organisation</h4>
                          <p className="text-brand-700 text-sm">Supports, conseils et matériel pour réussir votre rencontre</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start bg-white/60 rounded-lg p-4">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                          <UserCheck className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-brand-900 mb-1">Accompagnement</h4>
                          <p className="text-brand-700 text-sm">Un membre du collectif peut vous accompagner</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start bg-white/60 rounded-lg p-4">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                          <Coffee className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-brand-900 mb-1">Moment convivial</h4>
                          <p className="text-brand-700 text-sm">Échange décontracté dans une ambiance chaleureuse</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Carte et événements */}
                <div className="space-y-8">
                  {/* Carte en pleine largeur avec toggle */}
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold">Carte des cafés de quartier</h3>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="show-past-map" className="text-sm">
                          Afficher les événements passés
                        </Label>
                        <Switch
                          id="show-past-map"
                          checked={showPastOnMap}
                          onCheckedChange={setShowPastOnMap}
                        />
                      </div>
                    </div>
                    <NeighborhoodEventsMap
                      events={mapEvents}
                      selectedEvent={selectedEvent}
                      onEventSelect={(event) => setSelectedEvent(event as NeighborhoodEvent)}
                      center={mapCenter}
                      zoom={mapZoom}
                    />
                  </div>
                  
                  {/* Liste des événements en dessous */}
                  <div className="w-full">
                    {loading ? (
                      <div className="text-center py-8">
                        <p>Chargement des cafés de quartier...</p>
                      </div>
                    ) : error ? (
                      <div className="text-center py-8 text-red-500">
                        <p>Une erreur est survenue: {error}</p>
                      </div>
                    ) : events.length > 0 ? (
                      <div className="space-y-8">
                        {/* Événements futurs */}
                        {futureEvents.length > 0 && (
                          <div>
                            <h3 className="text-xl font-semibold mb-4 flex items-center">
                              <Calendar className="w-5 h-5 mr-2 text-brand" />
                              Prochains cafés de quartier
                            </h3>
                            <div className="space-y-4">
                              {futureEvents.map((event) => (
                                <EventCard key={event.id} event={event} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Événements passés (collapsible) */}
                        {pastEvents.length > 0 && (
                          <Collapsible open={isPastEventsOpen} onOpenChange={setIsPastEventsOpen}>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                                <h3 className="text-xl font-semibold flex items-center">
                                  <Clock className="w-5 h-5 mr-2 text-brand-500" />
                                  Cafés de quartier passés ({pastEvents.length})
                                </h3>
                                {isPastEventsOpen ? (
                                  <ChevronUp className="w-5 h-5" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 mt-4">
                              {pastEvents.map((event) => (
                                <EventCard key={event.id} event={event} isPast={true} />
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="max-w-md mx-auto">
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                            <Coffee className="w-10 h-10 text-amber-600" />
                          </div>
                          <h3 className="text-2xl font-semibold mb-3 text-brand-900">Aucun Café de quartier programmé</h3>
                          <p className="text-brand-700 mb-6 leading-relaxed">
                            Soyez le <span className="font-semibold text-amber-700">premier</span> à organiser une rencontre conviviale dans votre voisinage !
                          </p>
                          
                          <div className="space-y-3">
                            <Button asChild className="bg-amber-600 hover:bg-amber-700">
                              <Link to="/contact?type=organizer&subject=Je%20souhaite%20organiser%20un%20caf%C3%A9%20de%20quartier%20chez%20moi" className="inline-flex items-center">
                                <Coffee className="w-4 h-4 mr-2" />
                                Organiser le premier café
                              </Link>
                            </Button>
                            <p className="text-xs text-brand-500">
                              Nous vous fournirons tout le nécessaire pour réussir votre rencontre
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default NeighborhoodEventsPage;
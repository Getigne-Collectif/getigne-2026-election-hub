
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, Calendar, MapPin, Users, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import EventRegistration from '@/components/events/EventRegistration';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/richTextContent.css';
import { useAuth } from '@/context/auth';

const EventDetailPage = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const [eventId, setEventId] = useState<string | null>(null);
  const { user, isMember } = useAuth();
  const [refreshRegistrations, setRefreshRegistrations] = useState(false);

  // Fonction de log pour le débogage
  const logDebug = (message: string, data?: any) => {
    if (data) {
      console.log(`[EventDetailPage] ${message}:`, data);
    } else {
      console.log(`[EventDetailPage] ${message}`);
    }
  };

  // Détermine si nous avons un ID ou un slug
  useEffect(() => {
    // Vérifie si nous avons un ID ou un slug
    if (id) {
      // Vérifie si l'ID est un UUID (36 caractères avec des tirets)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (isUuid) {
        logDebug("Setting event ID from UUID param", id);
        setEventId(id);
      } else {
        // Si ce n'est pas un UUID, c'est probablement un slug
        logDebug("ID param is not a UUID, treating as slug", id);
      }
    }
  }, [id]);

  logDebug('Params received', { id, slug });
  logDebug('Auth state', { isLoggedIn: !!user, isMember });
  
  // Si nous avons un slug, récupérer d'abord l'ID réel
  const { data: slugData, isLoading: isLoadingSlug, error: slugError } = useQuery({
    queryKey: ['event-slug', id, slug],
    queryFn: async () => {
      const slugToUse = slug || (!eventId ? id : null);
      if (!slugToUse) return null;
      
      logDebug("Fetching event by slug", slugToUse);
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slugToUse)
        .eq('status', 'published')
        .maybeSingle();
      
      if (error) {
        logDebug("Error fetching event by slug", error);
        throw error;
      }
      
      logDebug("Found event by slug", data);
      return data;
    },
    enabled: !!slug || (!!id && !eventId),
  });

  // Une fois que nous avons l'ID (soit directement, soit à partir du slug), récupérer les détails de l'événement
  useEffect(() => {
    if (slugData && slugData.id) {
      logDebug("Setting event ID from slug data", slugData.id);
      setEventId(slugData.id);
    }
  }, [slugData]);

  const { data: event, isLoading: isLoadingEvent, error: eventError } = useQuery({
    queryKey: ['event', eventId, refreshRegistrations],
    queryFn: async () => {
      if (!eventId) return null;
      
      logDebug("Fetching event details by ID", eventId);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('status', 'published')
        .maybeSingle();
      
      if (error) {
        logDebug("Error fetching event details", error);
        throw error;
      }
      
      logDebug("Found event details", data);
      return data;
    },
    enabled: !!eventId,
  });

  // Rediriger vers l'URL avec slug si on est sur une URL avec ID et que l'événement a un slug
  useEffect(() => {
    if (eventId && event && event.slug && (id === eventId)) {
      logDebug("Redirecting to slug URL", event.slug);
      navigate(`/agenda/${event.slug}`, { replace: true });
    }
  }, [eventId, event, id, navigate]);

  const isLoading = isLoadingSlug || isLoadingEvent || (!eventId && !slugError);
  const error = slugError || eventError;

  const handleRegistrationChange = () => {
    setRefreshRegistrations(prev => !prev);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow container mx-auto px-4 py-24 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    logDebug("Error displaying event", error);
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow container mx-auto px-4 py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Erreur</h1>
            <p className="mb-6">Une erreur s'est produite lors du chargement de l'événement.</p>
            <Button onClick={() => navigate('/agenda')}>
              Retour à l'agenda
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow container mx-auto px-4 py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Événement non trouvé</h1>
            <p className="mb-6">L'événement que vous recherchez n'existe pas ou a été supprimé.</p>
            <Button onClick={() => navigate('/agenda')}>
              Retour à l'agenda
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Vérifier si l'événement est réservé aux membres et si l'utilisateur n'est pas membre
  const isMembersOnly = event.is_members_only === true;
  const hasAccess = !isMembersOnly || isMember;

  const eventDate = new Date(event.date);
  const formattedDate = format(eventDate, "PPPP", { locale: fr });
  const formattedTime = format(eventDate, "HH'h'mm", { locale: fr });
  
  // Vérifier si l'événement est passé
  const isPastEvent = new Date() > eventDate;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="pt-24 pb-4 bg-getigne-50">
        <div className="container mx-auto px-4">
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/agenda')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'agenda
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center text-getigne-700">
                  <Calendar className="mr-2 h-5 w-5" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center text-getigne-700">
                  <Clock className="mr-2 h-5 w-5" />
                  <span>{formattedTime}</span>
                </div>
                <div className="flex items-center text-getigne-700">
                  <MapPin className="mr-2 h-5 w-5" />
                  <span>{event.location}</span>
                </div>
                {event.committee && (
                  <div className="flex items-center text-getigne-700">
                    <Users className="mr-2 h-5 w-5" />
                    <span>{event.committee}</span>
                  </div>
                )}
              </div>
              
              <div className="mb-8">
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full rounded-lg object-cover h-64 md:h-80"
                />
              </div>
              
              <div className="prose max-w-none rich-content">
                <p className="text-lg font-medium mb-4">{event.description}</p>
                
                {isMembersOnly && !hasAccess ? (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-6">
                    <p className="text-yellow-700">
                      Cet événement est réservé aux adhérents. Veuillez vous connecter avec un compte adhérent pour accéder au contenu complet.
                    </p>
                    {!user && (
                      <Button 
                        onClick={() => navigate('/auth?redirect=' + window.location.pathname)} 
                        className="mt-4"
                      >
                        Se connecter
                      </Button>
                    )}
                  </div>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {event.content || ''}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          </div>
          
          <div>
            {event.allow_registration && (
              <div className="bg-getigne-50 p-6 rounded-lg mb-6">
                <h2 className="text-xl font-bold mb-4">Inscription</h2>
                <EventRegistration 
                  eventId={event.id} 
                  isMembersOnly={isMembersOnly}
                  allowRegistration={event.allow_registration}
                  isPastEvent={isPastEvent}
                  onRegistrationChange={handleRegistrationChange}
                />
              </div>
            )}
            
            <div className="bg-getigne-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">À retenir</h2>
              <ul className="space-y-3">
                <li className="flex">
                  <Calendar className="mr-3 h-5 w-5 text-getigne-600 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Date:</span> {formattedDate}
                  </div>
                </li>
                <li className="flex">
                  <Clock className="mr-3 h-5 w-5 text-getigne-600 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Heure:</span> {formattedTime}
                  </div>
                </li>
                <li className="flex">
                  <MapPin className="mr-3 h-5 w-5 text-getigne-600 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Lieu:</span> {event.location}
                  </div>
                </li>
                {event.committee && (
                  <li className="flex">
                    <Users className="mr-3 h-5 w-5 text-getigne-600 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Commission:</span> {event.committee}
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default EventDetailPage;

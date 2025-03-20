
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
  const { id, slug } = useParams();
  const navigate = useNavigate();
  const [eventId, setEventId] = useState<string | null>(id || null);
  const { user, isMember } = useAuth();
  const [refreshRegistrations, setRefreshRegistrations] = useState(false);

  // If we have a slug, fetch the actual ID first
  const { data: slugData, isLoading: isLoadingSlug } = useQuery({
    queryKey: ['event-slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    enabled: !!slug,
  });

  // Once we have the ID (either directly or from slug), fetch the event details
  useEffect(() => {
    if (slug && slugData) {
      setEventId(slugData.id);
    }
  }, [slug, slugData]);

  const { data: event, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['event', eventId, refreshRegistrations],
    queryFn: async () => {
      if (!eventId) return null;
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    enabled: !!eventId,
  });

  const isLoading = isLoadingSlug || isLoadingEvent;

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

  // Check if the event is members-only and the user is not a member
  const isMembersOnly = event.is_members_only === true;
  const hasAccess = !isMembersOnly || isMember;

  const eventDate = new Date(event.date);
  const formattedDate = format(eventDate, "PPPP", { locale: fr });
  const formattedTime = format(eventDate, "HH'h'mm", { locale: fr });
  
  // Check if the event is in the past
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


import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { useEventDetails } from '@/hooks/useEventDetails';
import EventLoading from '@/components/events/EventLoading';
import EventError from '@/components/events/EventError';
import EventNotFound from '@/components/events/EventNotFound';
import EventDetails from '@/components/events/EventDetails';
import EventSidebar from '@/components/events/EventSidebar';
import { generateRoutes } from '@/routes';

const EventDetailPage = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const { user, isMember } = useAuth();
  const [refreshRegistrations, setRefreshRegistrations] = useState(false);
  
  // Use our custom hook to fetch event details
  const { 
    event, 
    eventId, 
    isLoading, 
    error, 
    formattedDate, 
    formattedTime,
    isPastEvent 
  } = useEventDetails(id, slug, refreshRegistrations);

  // Rediriger vers l'URL avec slug si on est sur une URL avec ID et que l'événement a un slug
  useEffect(() => {
    if (eventId && event && event.slug && (id === eventId)) {
      console.log("[EventDetailPage] Redirecting to slug URL", event.slug);
      navigate(`/agenda/${event.slug}`, { replace: true });
    }
  }, [eventId, event, id, navigate]);

  const handleRegistrationChange = () => {
    setRefreshRegistrations(prev => !prev);
  };

  // Handle navigation to login page
  const handleLoginClick = () => {
    navigate('/auth?redirect=' + window.location.pathname);
  };

  if (isLoading) {
    return <EventLoading />;
  }

  if (error) {
    console.log("[EventDetailPage] Error displaying event", error);
    return <EventError />;
  }

  if (!event) {
    return <EventNotFound />;
  }

  // Vérifier si l'événement est réservé aux membres et si l'utilisateur n'est pas membre
  const isMembersOnly = event.is_members_only === true;
  const hasAccess = !isMembersOnly || isMember;

  // Construire l'URL complète de l'événement
  const eventUrl = event.slug
    ? `${window.location.origin}${generateRoutes.eventDetail(event.slug)}`
    : `${window.location.origin}${generateRoutes.eventDetail(event.id)}`;

  // Description pour OpenGraph : utiliser la description ou extraire du contenu
  const eventDescription = event.description || 
    (event.content ? event.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '');

  return (
    <HelmetProvider>
      <Helmet>
        <title>{`${event.title} | Gétigné Collectif`}</title>
        <meta name="description" content={eventDescription} />
        
        {/* Balises OpenGraph pour les réseaux sociaux */}
        <meta property="og:type" content="event" />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={eventDescription} />
        <meta property="og:url" content={eventUrl} />
        {event.image && (
          <meta property="og:image" content={event.image} />
        )}
        <meta property="og:site_name" content="Gétigné Collectif" />
        {event.location && (
          <meta property="event:location" content={event.location} />
        )}
        <meta property="event:start_time" content={event.date} />
        {formattedDate && (
          <meta property="event:start_time_readable" content={`${formattedDate} ${formattedTime}`} />
        )}
        
        {/* Balises Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={eventDescription} />
        {event.image && (
          <meta name="twitter:image" content={event.image} />
        )}
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <div className="pt-24 pb-4 bg-brand-50">
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
            <EventDetails 
              event={event}
              hasAccess={hasAccess}
              isMembersOnly={isMembersOnly}
              formattedDate={formattedDate}
              formattedTime={formattedTime}
              onLogin={handleLoginClick}
            />
            
            <EventSidebar 
              event={event}
              isMembersOnly={isMembersOnly}
              isPastEvent={isPastEvent}
              formattedDate={formattedDate}
              formattedTime={formattedTime}
              onRegistrationChange={handleRegistrationChange}
            />
          </div>
        </div>
        
        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default EventDetailPage;

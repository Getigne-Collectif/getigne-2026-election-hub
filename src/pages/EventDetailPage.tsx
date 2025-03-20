
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  );
};

export default EventDetailPage;

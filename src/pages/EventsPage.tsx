
import { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const EventCard = ({ event, index }) => {
  const [isVisible, setIsVisible] = useState(false);
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

  return (
    <div 
      ref={ref}
      className={`bg-white rounded-xl overflow-hidden shadow-sm border border-getigne-100 hover-lift ${
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
        <p className="text-getigne-700 mb-6">{event.description}</p>
        <Button 
          asChild
          variant="outline" 
          className="w-full border-getigne-200 hover:bg-getigne-100"
        >
          <Link to={`/evenements/${event.id}`}>
            Plus d'informations
          </Link>
        </Button>
      </div>
    </div>
  );
};

const EventsPage = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
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
        past.sort((a, b) => new Date(b.date) - new Date(a.date));
        
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="py-24 px-4">
        <div className="container mx-auto">
          {/* Upcoming Events */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
              Agenda
            </span>
            <h1 className="text-4xl font-bold mt-4 mb-6">Nos prochains événements</h1>
            <p className="text-getigne-700 text-lg">
              Retrouvez toutes nos réunions publiques, ateliers participatifs et moments d'échange 
              pour construire ensemble l'avenir de Gétigné.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">Chargement des événements...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">Une erreur est survenue: {error}</div>
          ) : (
            <>
              {upcomingEvents.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingEvents.map((event, index) => (
                    <EventCard key={event.id} event={event} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-getigne-50 rounded-lg">
                  <h3 className="text-xl font-medium mb-2">Aucun événement à venir</h3>
                  <p className="text-getigne-700">Revenez bientôt pour découvrir nos futurs événements</p>
                </div>
              )}
            </>
          )}
          
          {/* Past Events Section */}
          {!loading && !error && pastEvents.length > 0 && (
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
                {pastEvents.map((event, index) => (
                  <EventCard key={event.id} event={event} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EventsPage;


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
  const [events, setEvents] = useState([]);
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
        
        setEvents(data);
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
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EventsPage;

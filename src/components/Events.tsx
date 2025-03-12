
import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

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
    <article 
      ref={ref}
      className={`flex flex-col md:flex-row bg-white rounded-xl overflow-hidden shadow-sm border border-getigne-100 hover-lift ${
        isVisible 
          ? 'opacity-100 translate-y-0 transition-all duration-700 ease-out' 
          : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
      <div className="md:w-2/3 p-6">
        <div className="flex flex-wrap gap-3 mb-3">
          <div className="flex items-center text-getigne-500 text-sm bg-getigne-50 px-3 py-1 rounded-full">
            <Calendar size={14} className="mr-1" />
            <time>{formatDate(event.date)}</time>
          </div>
          <div className="flex items-center text-getigne-500 text-sm bg-getigne-50 px-3 py-1 rounded-full">
            <Clock size={14} className="mr-1" />
            <span>{formatTime(event.date)}</span>
          </div>
          <div className="flex items-center text-getigne-500 text-sm bg-getigne-50 px-3 py-1 rounded-full">
            <MapPin size={14} className="mr-1" />
            <span>{event.location}</span>
          </div>
        </div>
        <h3 className="font-medium text-xl mb-2">{event.title}</h3>
        <p className="text-getigne-700 mb-4">{event.description}</p>
        <Link 
          to={`/evenements/${event.id}`} 
          className="text-getigne-accent flex items-center text-sm font-medium group"
        >
          Plus d'informations
          <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
};

const Events = () => {
  const [eventsData, setEventsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true })
          .limit(2);
        
        if (error) throw error;
        
        setEventsData(data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des événements:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <section id="evenements" className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center">Chargement des événements...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="evenements" className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center text-red-500">Une erreur est survenue: {error}</div>
        </div>
      </section>
    );
  }

  return (
    <section id="evenements" className="py-24 px-4">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
            Agenda
          </span>
          <h2 className="text-4xl font-bold mt-4 mb-6">Nos prochains événements</h2>
          <p className="text-getigne-700 text-lg">
            Participez à nos réunions, ateliers et moments d'échange pour contribuer à notre projet collectif.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {eventsData.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button 
            asChild
            className="bg-getigne-accent text-white rounded-md hover:bg-getigne-accent/90"
          >
            <Link to="/evenements">
              Voir tous les événements
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Events;

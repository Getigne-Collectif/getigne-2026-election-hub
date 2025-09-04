import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, ChevronRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Bike, Utensils, Music, Leaf } from 'lucide-react';

// Map committee names to colors
const committeeColors = {
  "Environnement": "border-getigne-green-500",
  "Mobilité": "border-getigne-accent",
  "Solidarité": "border-getigne-700",
  "Culture": "border-[#9b87f5]",
  "Économie": "border-[#0EA5E9]",
  "Éducation": "border-[#F97316]",
  "Biodiversité": "border-green-500",
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
  
  // Utiliser le slug s'il existe, sinon l'ID
  const eventUrl = event.slug ? `/agenda/${event.slug}` : `/agenda/${event.id}`;

  return (
    <Link to={eventUrl} className="block hover:no-underline">
      <article 
        ref={ref}
        className={`flex flex-col md:flex-row bg-white rounded-xl overflow-hidden shadow-sm ${borderClass} hover-lift ${
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
            {committeeData && (
              <div className={`flex items-center text-sm px-3 py-1 rounded-full ${committeeColor ? committeeColor.replace('border', 'bg').replace('getigne', 'getigne') : 'bg-getigne-50'} text-getigne-700`}>
                <IconComponent size={14} className="mr-1" />
                <span>Commission {committeeData.title}</span>
              </div>
            )}
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
            {event.is_members_only && (
              <div className="flex items-center text-white text-sm bg-getigne-700 px-3 py-1 rounded-full">
                <Users size={14} className="mr-1" />
                <span>Adhérents</span>
              </div>
            )}
          </div>
          <h3 className="font-medium text-xl mb-2">{event.title}</h3>
          <p className="text-getigne-700 mb-4">{event.description}</p>
          <div 
            className="text-getigne-accent flex items-center text-sm font-medium group"
          >
            En savoir plus
            <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
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
          .eq('status', 'published')
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
            Participez à nos réunions, ateliers et moments d'échanges pour contribuer à notre projet collectif.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {eventsData.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link 
            to="/agenda"
            className="bg-getigne-accent text-white rounded-md hover:bg-getigne-accent/90 px-4 py-2 inline-flex items-center"
          >
            Voir tous les événements
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Events;

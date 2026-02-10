import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, ChevronRight, Users, Coffee, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Bike, Utensils, Music, Leaf } from 'lucide-react';
import { Routes } from '@/routes';
import NeighborhoodEventsMap from '@/components/maps/NeighborhoodEventsMap';

// Map committee names to colors
const committeeColors = {
  "Environnement": "border-primary",
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
        className={`flex flex-col bg-white rounded-xl overflow-hidden shadow-sm ${borderClass} hover-lift ${
          isVisible 
            ? 'opacity-100 translate-y-0 transition-all duration-700 ease-out' 
            : 'opacity-0 translate-y-10'
        }`}
        style={{ transitionDelay: `${index * 100}ms` }}
      >
        <div className="w-full h-48 relative overflow-hidden">
          <img 
            src={event.image} 
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
        <div className="p-6">
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
  const [regularEvents, setRegularEvents] = useState([]);
  const [neighborhoodEvents, setNeighborhoodEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Récupérer les événements réguliers (non-neighborhood)
        const { data: regularData, error: regularError } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'published')
          .neq('event_type', 'neighborhood')
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(2);
        
        if (regularError) throw regularError;

        // Récupérer les cafés de quartier
        const { data: neighborhoodData, error: neighborhoodError } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'published')
          .eq('event_type', 'neighborhood')
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(2);
        
        if (neighborhoodError) throw neighborhoodError;
        
        setRegularEvents(regularData || []);
        setNeighborhoodEvents(neighborhoodData || []);
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

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Événements réguliers */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-getigne-900">Événements</h3>
              <Link 
                to={Routes.AGENDA}
                className="text-getigne-accent hover:text-getigne-accent/80 transition-colors text-sm font-medium inline-flex items-center"
              >
                Voir tout
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="space-y-6">
              {regularEvents.length > 0 ? (
                regularEvents.map((event, index) => (
                  <EventCard key={event.id} event={event} index={index} />
                ))
              ) : (
                <div className="text-center py-8 bg-getigne-50 rounded-lg">
                  <Calendar className="mx-auto h-12 w-12 text-getigne-300 mb-4" />
                  <p className="text-getigne-600">Aucun événement à venir</p>
                </div>
              )}
            </div>
          </div>

          {/* Cafés de quartier */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-getigne-900 flex items-center">
                <Coffee className="mr-2 h-6 w-6 text-getigne-accent" />
                Cafés de quartier
              </h3>
            </div>
            
            <div className="space-y-6">
              {loading ? (
                <div className="bg-getigne-50 rounded-lg h-80 flex items-center justify-center">
                  <p className="text-getigne-600">Chargement de la carte...</p>
                </div>
              ) : neighborhoodEvents.length > 0 ? (
                <>
                  <div className="rounded-lg overflow-hidden shadow-lg">
                    <NeighborhoodEventsMap
                      events={neighborhoodEvents}
                      selectedEvent={selectedEvent}
                      onEventSelect={setSelectedEvent}
                      center={{ lat: 47.0847, lng: -1.2614 }}
                    />
                  </div>
                  <div className="text-center">
                    <Link 
                      to={Routes.NEIGHBORHOOD_EVENTS}
                      className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      <Coffee className="mr-2 h-5 w-5" />
                      Découvrir les cafés de quartier
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center py-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                    <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Coffee className="w-8 h-8 text-amber-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-getigne-900 mb-2">Aucun Café de quartier programmé</h4>
                    <p className="text-getigne-600 mb-4">Soyez le premier à organiser une rencontre conviviale !</p>
                    <Link 
                      to="/contact?type=organizer&subject=Je%20souhaite%20organiser%20un%20caf%C3%A9%20de%20quartier%20chez%20moi"
                      className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Coffee className="mr-2 h-4 w-4" />
                      Organiser un Café de quartier
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Events;

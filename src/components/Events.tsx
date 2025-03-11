
import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Dummy events data
const eventsData = [
  {
    id: 1,
    title: "Réunion publique : Présentation du collectif",
    description: "Venez nous rencontrer et échanger sur notre projet pour Gétigné.",
    date: "15 mai 2024",
    time: "19h00",
    location: "Salle des Fêtes, Gétigné",
    image: "https://images.unsplash.com/photo-1560439514-4e9645039924?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    title: "Atelier participatif : Notre vision pour 2030",
    description: "Un atelier collaboratif pour imaginer ensemble l'avenir de notre commune.",
    date: "28 mai 2024",
    time: "18h30",
    location: "Espace culturel, Gétigné",
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
];

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
            <time>{event.date}</time>
          </div>
          <div className="flex items-center text-getigne-500 text-sm bg-getigne-50 px-3 py-1 rounded-full">
            <Clock size={14} className="mr-1" />
            <span>{event.time}</span>
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

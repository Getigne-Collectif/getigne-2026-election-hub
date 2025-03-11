
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Calendar as CalendarIcon, Clock, MapPin, Search, Filter, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Extended events data for the full page
const allEvents = [
  {
    id: 1,
    title: "Réunion publique : Présentation du collectif",
    description: "Venez nous rencontrer et échanger sur notre projet pour Gétigné.",
    date: "15 mai 2024",
    time: "19h00",
    location: "Salle des Fêtes, Gétigné",
    type: "Réunion publique",
    image: "https://images.unsplash.com/photo-1560439514-4e9645039924?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    title: "Atelier participatif : Notre vision pour 2030",
    description: "Un atelier collaboratif pour imaginer ensemble l'avenir de notre commune.",
    date: "28 mai 2024",
    time: "18h30",
    location: "Espace culturel, Gétigné",
    type: "Atelier",
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    title: "Café-débat : Mobilité et transports",
    description: "Échangeons autour des solutions pour améliorer la mobilité dans notre commune.",
    date: "10 juin 2024",
    time: "17h00",
    location: "Café du Centre, Gétigné",
    type: "Débat",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    title: "Stand d'information sur le marché",
    description: "Retrouvez notre équipe sur le marché pour échanger et répondre à vos questions.",
    date: "18 juin 2024",
    time: "9h00 - 12h00",
    location: "Marché hebdomadaire, Place centrale",
    type: "Information",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    title: "Rencontre avec les commerçants",
    description: "Échange avec les commerçants locaux sur les enjeux économiques de notre commune.",
    date: "25 juin 2024",
    time: "20h00",
    location: "Salle du Conseil, Mairie de Gétigné",
    type: "Rencontre",
    image: "https://images.unsplash.com/photo-1556744514-cdc6a09b45b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    title: "Forum des associations",
    description: "Venez nous rencontrer lors du forum des associations pour échanger sur notre projet associatif.",
    date: "5 juillet 2024",
    time: "14h00 - 18h00",
    location: "Complexe sportif, Gétigné",
    type: "Forum",
    image: "https://images.unsplash.com/photo-1540317580384-e5d43867cda4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
];

const EventCard = ({ event }) => (
  <article className="bg-white rounded-xl overflow-hidden shadow-sm border border-getigne-100 hover-lift">
    <div className="relative h-48 overflow-hidden">
      <img 
        src={event.image} 
        alt={event.title}
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
      />
      <div className="absolute top-0 right-0 bg-getigne-accent text-white px-3 py-1 text-sm font-medium">
        {event.type}
      </div>
    </div>
    <div className="p-6">
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex items-center text-getigne-500 text-sm bg-getigne-50 px-3 py-1 rounded-full">
          <CalendarIcon size={14} className="mr-1" />
          <time>{event.date}</time>
        </div>
        <div className="flex items-center text-getigne-500 text-sm bg-getigne-50 px-3 py-1 rounded-full">
          <Clock size={14} className="mr-1" />
          <span>{event.time}</span>
        </div>
      </div>
      <h3 className="font-medium text-xl mb-2">{event.title}</h3>
      <p className="text-getigne-700 mb-3">{event.description}</p>
      <div className="flex items-start text-getigne-500 text-sm mb-4">
        <MapPin size={16} className="mr-2 flex-shrink-0 mt-0.5" />
        <span>{event.location}</span>
      </div>
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

const EventsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState('Tous');
  
  // List of unique event types
  const eventTypes = ['Tous', ...new Set(allEvents.map(event => event.type))];
  
  // Filter events based on search and type
  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeType === 'Tous' || event.type === activeType;
    return matchesSearch && matchesType;
  });

  // Sort events by date (assuming date format is consistent)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = new Date(a.date.split(' ').reverse().join('-'));
    const dateB = new Date(b.date.split(' ').reverse().join('-'));
    return dateA - dateB;
  });

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 pb-12 bg-getigne-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
              Agenda
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Nos prochains événements</h1>
            <p className="text-getigne-700 text-lg mb-8">
              Participez à nos réunions, ateliers et moments d'échange pour contribuer à notre projet collectif.
            </p>
          </div>
        </div>
      </div>

      {/* Events content */}
      <main className="flex-grow py-16">
        <div className="container mx-auto px-4">
          {/* Search and filters */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-getigne-500" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un événement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full md:w-80 border border-getigne-200 rounded-md focus:outline-none focus:ring-2 focus:ring-getigne-accent"
                />
              </div>

              {/* Types */}
              <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center md:justify-end">
                {eventTypes.map((type) => (
                  <Button
                    key={type}
                    variant={activeType === type ? "default" : "outline"}
                    className={
                      activeType === type 
                        ? "bg-getigne-accent hover:bg-getigne-accent/90 text-white" 
                        : "border-getigne-200 text-getigne-700"
                    }
                    onClick={() => setActiveType(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Events grid */}
          {sortedEvents.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {sortedEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">Aucun événement ne correspond à votre recherche</h3>
              <p className="text-getigne-700">Essayez avec d'autres mots-clés ou types d'événements</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventsPage;

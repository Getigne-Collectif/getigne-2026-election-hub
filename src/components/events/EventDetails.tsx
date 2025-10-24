
import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Users, Coffee, Package, UserCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '@/styles/richTextContent.css';

interface EventDetailsProps {
  event: any;
  hasAccess: boolean;
  isMembersOnly: boolean;
  formattedDate: string;
  formattedTime: string;
  onLogin: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({
  event,
  hasAccess,
  isMembersOnly,
  formattedDate,
  formattedTime,
  onLogin
}) => {
  return (
    <div className="lg:col-span-2">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-getigne-700">
            <Calendar className="mr-3 h-5 w-5 text-getigne-accent" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center text-getigne-700">
            <Clock className="mr-3 h-5 w-5 text-getigne-accent" />
            <span>{formattedTime}</span>
          </div>
          <div className="flex items-center text-getigne-700">
            <MapPin className="mr-3 h-5 w-5 text-getigne-accent" />
            <span>{event.location}</span>
          </div>
          {event.committee && (
            <div className="flex items-center text-getigne-700">
              <Users className="mr-3 h-5 w-5 text-getigne-accent" />
              <span>{event.committee}</span>
            </div>
          )}
          {event.max_participants && (
            <div className="flex items-center text-getigne-700">
              <Users className="mr-3 h-5 w-5 text-getigne-accent" />
              <span>Maximum {event.max_participants} participants</span>
            </div>
          )}
          {event.organizer_name && (
            <div className="flex items-center text-getigne-700">
              <Users className="mr-3 h-5 w-5 text-getigne-accent" />
              <span>Organisé par {event.organizer_name}</span>
            </div>
          )}
        </div>

        {/* Event type badge for neighborhood events */}
        {event.event_type === 'neighborhood' && (
          <div className="mb-6">
            <div className="inline-flex items-center bg-getigne-accent/10 text-getigne-accent px-4 py-2 rounded-full text-sm font-medium">
              <Coffee className="mr-2 h-4 w-4" />
              Café de quartier
            </div>
          </div>
        )}
        
        <div className="mb-8">
          <img 
            src={event.image} 
            alt={event.title} 
            className="w-full rounded-lg object-cover h-auto"
          />
        </div>
        
        <div className="prose max-w-none rich-content">
          <p className="text-lg font-medium mb-4">{event.description}</p>
          
          {isMembersOnly && !hasAccess ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-6">
              <p className="text-yellow-700">
                Cet événement est réservé aux adhérents. Veuillez vous connecter avec un compte adhérent pour accéder au contenu complet.
              </p>
              <button 
                onClick={onLogin} 
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Se connecter
              </button>
            </div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {event.content || ''}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;

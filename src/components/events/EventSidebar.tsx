
import React from 'react';
import { Calendar, Clock, MapPin, Users, Coffee, Package, UserCheck, Mail, Phone } from 'lucide-react';
import EventRegistration from '@/components/events/EventRegistration';

interface EventSidebarProps {
  event: any;
  isMembersOnly: boolean;
  isPastEvent: boolean;
  formattedDate: string;
  formattedTime: string;
  onRegistrationChange: () => void;
}

const EventSidebar: React.FC<EventSidebarProps> = ({
  event,
  isMembersOnly,
  isPastEvent,
  formattedDate,
  formattedTime,
  onRegistrationChange
}) => {
  return (
    <div>
      {event.allow_registration && (
        <div className="bg-brand-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">Inscription</h2>
          <EventRegistration 
            eventId={event.id} 
            isMembersOnly={isMembersOnly}
            allowRegistration={event.allow_registration}
            isPastEvent={isPastEvent}
            onRegistrationChange={onRegistrationChange}
            event={event}
          />
        </div>
      )}
      
      <div className="bg-brand-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">À retenir</h2>
        <ul className="space-y-3">
          <li className="flex">
            <Calendar className="mr-3 h-5 w-5 text-brand-600 flex-shrink-0" />
            <div>
              <span className="font-medium">Date:</span> {formattedDate}
            </div>
          </li>
          <li className="flex">
            <Clock className="mr-3 h-5 w-5 text-brand-600 flex-shrink-0" />
            <div>
              <span className="font-medium">Heure:</span> {formattedTime}
            </div>
          </li>
          <li className="flex">
            <MapPin className="mr-3 h-5 w-5 text-brand-600 flex-shrink-0" />
            <div>
              <span className="font-medium">Lieu:</span> {event.location}
            </div>
          </li>
          {event.committee && (
            <li className="flex">
              <Users className="mr-3 h-5 w-5 text-brand-600 flex-shrink-0" />
              <div>
                <span className="font-medium">Commission:</span> {event.committee}
              </div>
            </li>
          )}
          {event.organizer_name && (
            <li className="flex">
              <Users className="mr-3 h-5 w-5 text-brand-600 flex-shrink-0" />
              <div>
                <span className="font-medium">Organisateur:</span> {event.organizer_name}
              </div>
            </li>
          )}
        </ul>
      </div>

      {/* Special section for neighborhood events */}
      {event.event_type === 'neighborhood' && (
        <>
          {/* Contact information for organizer */}
          {event.organizer_contact && (
            <div className="bg-brand/5 p-6 rounded-lg mt-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Coffee className="mr-2 h-5 w-5 text-brand" />
                Contact
              </h2>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-brand-700">
                  {event.organizer_contact.includes('@') ? (
                    <>
                      <Mail className="mr-2 h-4 w-4 text-brand" />
                      <a href={`mailto:${event.organizer_contact}`} className="hover:text-brand">
                        {event.organizer_contact}
                      </a>
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-4 w-4 text-brand" />
                      <a href={`tel:${event.organizer_contact}`} className="hover:text-brand">
                        {event.organizer_contact}
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
};

export default EventSidebar;

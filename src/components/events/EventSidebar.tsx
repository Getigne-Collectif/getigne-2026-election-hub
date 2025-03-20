
import React from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
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
        <div className="bg-getigne-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">Inscription</h2>
          <EventRegistration 
            eventId={event.id} 
            isMembersOnly={isMembersOnly}
            allowRegistration={event.allow_registration}
            isPastEvent={isPastEvent}
            onRegistrationChange={onRegistrationChange}
          />
        </div>
      )}
      
      <div className="bg-getigne-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">À retenir</h2>
        <ul className="space-y-3">
          <li className="flex">
            <Calendar className="mr-3 h-5 w-5 text-getigne-600 flex-shrink-0" />
            <div>
              <span className="font-medium">Date:</span> {formattedDate}
            </div>
          </li>
          <li className="flex">
            <Clock className="mr-3 h-5 w-5 text-getigne-600 flex-shrink-0" />
            <div>
              <span className="font-medium">Heure:</span> {formattedTime}
            </div>
          </li>
          <li className="flex">
            <MapPin className="mr-3 h-5 w-5 text-getigne-600 flex-shrink-0" />
            <div>
              <span className="font-medium">Lieu:</span> {event.location}
            </div>
          </li>
          {event.committee && (
            <li className="flex">
              <Users className="mr-3 h-5 w-5 text-getigne-600 flex-shrink-0" />
              <div>
                <span className="font-medium">Commission:</span> {event.committee}
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default EventSidebar;

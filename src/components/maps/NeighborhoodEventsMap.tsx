import React, { useCallback, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NeighborhoodEvent {
  id: string;
  title: string;
  location: string;
  latitude?: number;
  longitude?: number;
  date: string;
}

interface NeighborhoodEventsMapProps {
  events: NeighborhoodEvent[];
  selectedEvent?: NeighborhoodEvent | null;
  onEventSelect?: (event: NeighborhoodEvent) => void;
  center?: { lat: number; lng: number };
}

// Composant Map qui utilise l'API Google Maps
const Map: React.FC<{
  events: NeighborhoodEvent[];
  selectedEvent?: NeighborhoodEvent | null;
  onEventSelect?: (event: NeighborhoodEvent) => void;
  center: { lat: number; lng: number };
}> = ({ events, selectedEvent, onEventSelect, center }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);

  React.useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom: 13,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });
      setMap(newMap);
      
      const newInfoWindow = new google.maps.InfoWindow();
      setInfoWindow(newInfoWindow);
    }
  }, [ref, map, center]);

  // Gestion des marqueurs
  React.useEffect(() => {
    if (!map || !infoWindow) return;

    // Nettoyer les anciens marqueurs
    markers.forEach(marker => marker.setMap(null));
    
    const newMarkers: google.maps.Marker[] = [];

    events.forEach(event => {
      if (event.latitude && event.longitude) {
        const marker = new google.maps.Marker({
          position: { lat: event.latitude, lng: event.longitude },
          map,
          title: event.title,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
                <!-- Cercle de fond -->
                <circle cx="25" cy="25" r="22" fill="#d97706" stroke="white" stroke-width="4"/>
                <!-- Icône de café parfaitement centrée -->
                <g transform="translate(25, 25)">
                  <path d="M-4 -9v2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M0 -9v2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 -5a1 1 0 0 1 1 1v6a3 3 0 0 1-3 3H-6a3 3 0 0 1-3-3v-6a1 1 0 0 1 1-1h10a3 3 0 1 1 0 6h-1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                  <path d="M-8 -9v2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
              </svg>
            `),
            scaledSize: new google.maps.Size(50, 50),
            anchor: new google.maps.Point(25, 25),
          },
        });

        marker.addListener('click', () => {
          const eventDate = new Date(event.date);
          const formattedDate = format(eventDate, "PPPP", { locale: fr });
          const formattedTime = format(eventDate, "HH'h'mm", { locale: fr });
          
          const content = `
            <div style="max-width: 250px; padding: 8px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">${event.title}</h3>
              <div style="margin-bottom: 6px; display: flex; align-items: center; font-size: 14px; color: #6b7280;">
                <span style="margin-right: 8px;">📅</span> ${formattedDate}
              </div>
              <div style="margin-bottom: 6px; display: flex; align-items: center; font-size: 14px; color: #6b7280;">
                <span style="margin-right: 8px;">🕒</span> ${formattedTime}
              </div>
              <div style="margin-bottom: 8px; display: flex; align-items: center; font-size: 14px; color: #6b7280;">
                <span style="margin-right: 8px;">📍</span> ${event.location}
              </div>
              <button onclick="window.open('/agenda/${event.slug || event.id}', '_self')" 
                      style="background: #f97316; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">
                Voir les détails
              </button>
            </div>
          `;

          infoWindow.setContent(content);
          infoWindow.open(map, marker);
          
          if (onEventSelect) {
            onEventSelect(event);
          }
        });

        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);
  }, [map, events, infoWindow, onEventSelect]);

  // Centrer sur l'événement sélectionné
  React.useEffect(() => {
    if (map && selectedEvent && selectedEvent.latitude && selectedEvent.longitude) {
      map.panTo({ lat: selectedEvent.latitude, lng: selectedEvent.longitude });
      map.setZoom(15);
    }
  }, [map, selectedEvent]);

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
};

// Composant de rendu des statuts de chargement
const render = (status: Status) => {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="bg-gray-100 rounded-lg h-96 lg:h-[500px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-getigne-accent mx-auto mb-2"></div>
            <p>Chargement de la carte...</p>
          </div>
        </div>
      );
    case Status.FAILURE:
      return (
        <div className="bg-red-50 rounded-lg h-96 lg:h-[500px] flex items-center justify-center">
          <div className="text-center text-red-500 p-4">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium">Erreur de chargement Google Maps</p>
            <p className="text-sm mb-3">Configuration de l'API requise</p>
            <div className="text-xs text-red-600 bg-red-100 p-3 rounded-lg max-w-md">
              <p className="font-medium mb-1">Pour résoudre :</p>
              <p>1. Aller dans Google Cloud Console</p>
              <p>2. API et services → Identifiants</p>
              <p>3. Ajouter "localhost:8080/*" aux restrictions</p>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div className="bg-gray-100 rounded-lg h-96 lg:h-[500px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Chargement...</p>
          </div>
        </div>
      );
  }
};

const NeighborhoodEventsMap: React.FC<NeighborhoodEventsMapProps> = ({
  events,
  selectedEvent,
  onEventSelect,
  center = { lat: 47.0847, lng: -1.2614 } // Coordonnées de Gétigné
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_TOKEN;

  // Écouter les messages du contenu de l'InfoWindow
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'selectEvent' && onEventSelect) {
        const selectedEventData = events.find(e => e.id === event.data.eventId);
        if (selectedEventData) {
          onEventSelect(selectedEventData);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [events, onEventSelect]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-getigne-100">
      <div className="p-6">
        <h3 className="font-semibold mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-getigne-accent" />
          Carte des rencontres
        </h3>
        <div className="rounded-lg h-96 lg:h-[500px] overflow-hidden">
          <Wrapper apiKey={apiKey} render={render}>
            <Map
              events={events}
              selectedEvent={selectedEvent}
              onEventSelect={onEventSelect}
              center={center}
            />
          </Wrapper>
        </div>
        
        {events.length > 0 ? (
          <div className="mt-4 text-sm text-getigne-600">
            <p>{events.length} café(s) de quartier affiché(s) sur la carte</p>
          </div>
        ) : (
          <div className="mt-4 text-sm text-getigne-500">
            <p>Aucun Café de quartier à afficher sur la carte</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeighborhoodEventsMap;

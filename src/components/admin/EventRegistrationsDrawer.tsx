import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EventRegistration {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
  status: string;
  additional_guests: number;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface EventRegistrationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

export const EventRegistrationsDrawer: React.FC<EventRegistrationsDrawerProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
}) => {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchRegistrations();
    }
  }, [isOpen, eventId]);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          id,
          user_id,
          event_id,
          created_at,
          status,
          additional_guests,
          profiles (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching registrations:', error);
        setError('Erreur lors du chargement des inscriptions');
        return;
      }

      setRegistrations(data || []);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError('Erreur lors du chargement des inscriptions');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Inscrit</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Annulé</Badge>;
      case 'waiting':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants inscrits
          </SheetTitle>
          <SheetDescription>
            Liste des personnes inscrites à l'événement "{eventTitle}"
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Chargement des inscriptions...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchRegistrations} variant="outline">
                Réessayer
              </Button>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune inscription pour cet événement</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  {registrations.length} inscription{registrations.length > 1 ? 's' : ''} ({registrations.reduce((total, reg) => total + 1 + (reg.additional_guests || 0), 0)} personnes au total)
                </p>
                <Button onClick={fetchRegistrations} variant="outline" size="sm">
                  Actualiser
                </Button>
              </div>
              
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {registrations.map((registration) => (
                  <div
                    key={registration.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={registration.profiles.avatar_url} />
                      <AvatarFallback>
                        {getInitials(registration.profiles.first_name, registration.profiles.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {registration.profiles.first_name} {registration.profiles.last_name}
                        </p>
                        {getStatusBadge(registration.status)}
                      </div>
                      
                      <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          <span>{1 + (registration.additional_guests || 0)} personne{(1 + (registration.additional_guests || 0)) > 1 ? 's' : ''}</span>
                          {registration.additional_guests > 0 && (
                            <span className="ml-1 text-gray-400">(dont {registration.additional_guests} invité{registration.additional_guests > 1 ? 's' : ''})</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center mt-1 text-xs text-gray-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          Inscrit le {format(new Date(registration.created_at), "PPP", { locale: fr })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EventRegistrationsDrawer;

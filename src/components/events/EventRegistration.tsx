
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { Loader2, Check, X, Users } from 'lucide-react';

interface EventRegistrationProps {
  eventId: string;
  isMembersOnly: boolean;
  allowRegistration: boolean;
  isPastEvent: boolean;
  onRegistrationChange: () => void;
}

export const EventRegistration: React.FC<EventRegistrationProps> = ({
  eventId,
  isMembersOnly,
  allowRegistration,
  isPastEvent,
  onRegistrationChange
}) => {
  const { user, isMember } = useAuth();
  const { toast } = useToast();
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [unregistering, setUnregistering] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    if (user) {
      checkRegistrationStatus();
      fetchParticipantCount();
    } else {
      setLoading(false);
    }
  }, [user, eventId]);

  const checkRegistrationStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking registration status:', error);
      }
      
      setIsRegistered(!!data);
      setLoading(false);
    } catch (error) {
      console.error('Error checking registration:', error);
      setLoading(false);
    }
  };

  const fetchParticipantCount = async () => {
    try {
      const { count, error } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);
      
      if (error) {
        console.error('Error fetching participant count:', error);
      } else {
        setParticipantCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching participant count:', error);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour vous inscrire à un événement',
        variant: 'destructive'
      });
      return;
    }

    if (isMembersOnly && !isMember) {
      toast({
        title: 'Événement réservé aux adhérents',
        description: 'Seuls les adhérents peuvent s\'inscrire à cet événement',
        variant: 'destructive'
      });
      return;
    }

    setRegistering(true);
    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert([
          { user_id: user.id, event_id: eventId }
        ]);

      if (error) {
        console.error('Error registering for event:', error);
        toast({
          title: 'Erreur d\'inscription',
          description: error.message || 'Une erreur est survenue lors de l\'inscription',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Inscription confirmée',
          description: 'Vous êtes inscrit à cet événement',
          variant: 'default'
        });
        setIsRegistered(true);
        fetchParticipantCount();
        onRegistrationChange();
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive'
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!user) return;

    setUnregistering(true);
    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      if (error) {
        console.error('Error unregistering from event:', error);
        toast({
          title: 'Erreur de désinscription',
          description: error.message || 'Une erreur est survenue lors de la désinscription',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Désinscription confirmée',
          description: 'Vous n\'êtes plus inscrit à cet événement',
          variant: 'default'
        });
        setIsRegistered(false);
        fetchParticipantCount();
        onRegistrationChange();
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive'
      });
    } finally {
      setUnregistering(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-4"><Loader2 className="animate-spin h-5 w-5" /></div>;
  }

  if (!allowRegistration) {
    return (
      <div className="bg-getigne-50 p-4 rounded-lg mb-4">
        <p className="text-getigne-700 text-sm">Les inscriptions sont fermées pour cet événement.</p>
      </div>
    );
  }

  if (isPastEvent) {
    return (
      <div className="bg-getigne-50 p-4 rounded-lg mb-4">
        <p className="text-getigne-700 text-sm">Cet événement est déjà passé.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-getigne-50 p-4 rounded-lg mb-4">
        <p className="text-getigne-700 mb-3">Connectez-vous pour vous inscrire à cet événement</p>
        <Button 
          asChild
          className="bg-getigne-accent hover:bg-getigne-accent/90"
        >
          <Link to="/auth">Se connecter / S'inscrire</Link>
        </Button>
      </div>
    );
  }

  if (isMembersOnly && !isMember) {
    return (
      <div className="bg-getigne-50 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Users size={18} className="text-getigne-700" />
          <p className="font-medium text-getigne-900">Événement réservé aux adhérents</p>
        </div>
        <p className="text-getigne-700 mb-3">Cet événement est réservé aux adhérents. Devenez adhérent pour pouvoir vous inscrire.</p>
        <Button 
          asChild
          className="bg-getigne-accent hover:bg-getigne-accent/90"
        >
          <Link to="/adherer">Devenir adhérent</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-getigne-100 p-4 rounded-lg mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Inscription à l'événement</h3>
        <div className="text-getigne-500 text-sm flex items-center">
          <Users size={16} className="mr-1" />
          <span>{participantCount} participant{participantCount > 1 ? 's' : ''}</span>
        </div>
      </div>
      
      {isRegistered ? (
        <div>
          <div className="flex items-center gap-2 mb-3 text-sm text-green-600 bg-green-50 p-2 rounded">
            <Check size={16} />
            <span>Vous êtes inscrit à cet événement</span>
          </div>
          <Button 
            variant="outline" 
            className="w-full border-getigne-200 text-getigne-700"
            onClick={handleUnregister}
            disabled={unregistering}
          >
            {unregistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
            Se désinscrire
          </Button>
        </div>
      ) : (
        <Button 
          className="w-full bg-getigne-accent hover:bg-getigne-accent/90"
          onClick={handleRegister}
          disabled={registering}
        >
          {registering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          S'inscrire
        </Button>
      )}
    </div>
  );
};

export default EventRegistration;

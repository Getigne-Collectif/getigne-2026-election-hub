import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { Loader2, Check, X, Users, Plus, Minus } from 'lucide-react';
import { sendDiscordNotification, DiscordColors } from '@/utils/notifications';
import { Routes } from '@/routes';
import { usePostHog } from '@/hooks/usePostHog';

interface EventRegistrationProps {
  eventId: string;
  isMembersOnly: boolean;
  allowRegistration: boolean;
  isPastEvent: boolean;
  onRegistrationChange: () => void;
  event?: any; // Ajouter l'événement complet pour accéder à max_participants
}

export const EventRegistration: React.FC<EventRegistrationProps> = ({
  eventId,
  isMembersOnly,
  allowRegistration,
  isPastEvent,
  onRegistrationChange,
  event
}) => {
  const { user, isMember } = useAuth();
  const { toast } = useToast();
  const { capture } = usePostHog();
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [unregistering, setUnregistering] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [additionalGuests, setAdditionalGuests] = useState(0);
  const [registrationData, setRegistrationData] = useState<any>(null);

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
      if (data) {
        setRegistrationData(data);
        setAdditionalGuests(data.additional_guests || 0);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking registration:', error);
      setLoading(false);
    }
  };

  const fetchParticipantCount = async () => {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('additional_guests')
        .eq('event_id', eventId);
      
      if (error) {
        console.error('Error fetching participant count:', error);
      } else {
        // Calculer le nombre total de participants (utilisateurs + invités additionnels)
        const totalParticipants = data?.reduce((total, registration) => {
          return total + 1 + (registration.additional_guests || 0);
        }, 0) || 0;
        setParticipantCount(totalParticipants);
      }
    } catch (error) {
      console.error('Error fetching participant count:', error);
    }
  };

  // Calculer les places restantes
  const getAvailableSpots = () => {
    if (!event?.max_participants) return null;
    const available = event.max_participants - participantCount;
    return Math.max(0, available);
  };

  const availableSpots = getAvailableSpots();

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

    // Vérifier si le maximum de participants est atteint (en incluant l'utilisateur et les invités)
    const totalWithUserAndGuests = participantCount + 1 + additionalGuests;
    if (event?.max_participants && totalWithUserAndGuests > event.max_participants) {
      toast({
        title: 'Événement complet',
        description: `Le nombre maximum de participants (${event.max_participants}) serait dépassé. Places restantes: ${availableSpots || 0}`,
        variant: 'destructive'
      });
      return;
    }

    setRegistering(true);
    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert([
          { user_id: user.id, event_id: eventId, additional_guests: additionalGuests }
        ]);

      if (error) {
        console.error('Error registering for event:', error);
        toast({
          title: 'Erreur d\'inscription',
          description: error.message || 'Une erreur est survenue lors de l\'inscription',
          variant: 'destructive'
        });
      } else {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', user.id)
          .single();
          
        const { data: eventData } = await supabase
          .from('events')
          .select('title, date')
          .eq('id', eventId)
          .single();
          
        if (profileData && eventData) {
          const userName = `${profileData.first_name} ${profileData.last_name}`;
          const eventDate = new Date(eventData.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
          
          await sendDiscordNotification({
            title: `🎟️ Nouvelle inscription à l'événement: ${eventData.title}`,
            message: `
**Participant**: ${userName} (${profileData.email})
**Événement**: ${eventData.title}
**Date**: ${eventDate}
**Invités additionnels**: ${additionalGuests}
**Nombre total de participants**: ${participantCount + 1 + additionalGuests}
            `,
            color: DiscordColors.PURPLE,
            username: "Système d'Événements"
          });
        }
        
        toast({
          title: 'Inscription confirmée',
          description: additionalGuests > 0 
            ? `Vous êtes inscrit à cet événement avec ${additionalGuests} invité${additionalGuests > 1 ? 's' : ''} additionnel${additionalGuests > 1 ? 's' : ''}`
            : 'Vous êtes inscrit à cet événement',
          variant: 'default'
        });
        
        // Track event registration in PostHog
        capture('event_registration', {
          event_id: eventId,
          event_title: eventData?.title,
          event_date: eventData?.date,
          user_id: user.id,
          is_member: isMember,
          is_members_only: isMembersOnly,
          participant_count: participantCount + 1 + additionalGuests,
          additional_guests: additionalGuests
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
        // Get event data for tracking
        const { data: eventData } = await supabase
          .from('events')
          .select('title, date')
          .eq('id', eventId)
          .single();
        
        toast({
          title: 'Désinscription confirmée',
          description: 'Vous n\'êtes plus inscrit à cet événement',
          variant: 'default'
        });
        
        // Track event unregistration in PostHog
        capture('event_unregistration', {
          event_id: eventId,
          event_title: eventData?.title,
          event_date: eventData?.date,
          user_id: user.id,
          is_member: isMember,
          is_members_only: isMembersOnly,
          participant_count: participantCount - 1
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

  const handleUpdateGuests = async (newGuestCount: number) => {
    if (!user || !isRegistered) return;

    // Vérifier la limite si elle existe
    if (event?.max_participants) {
      // Calculer le total avec le nouveau nombre d'invités
      // participantCount inclut déjà l'utilisateur actuel et ses invités
      const currentUserAndGuestsCount = 1 + additionalGuests;
      const newTotal = participantCount - currentUserAndGuestsCount + 1 + newGuestCount;
      
      if (newTotal > event.max_participants) {
        const available = event.max_participants - (participantCount - currentUserAndGuestsCount) - 1;
        toast({
          title: 'Limite atteinte',
          description: `Impossible d'ajouter plus d'invités. Places restantes: ${Math.max(0, available)}`,
          variant: 'destructive'
        });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({ additional_guests: newGuestCount })
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      if (error) {
        console.error('Error updating guests:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de mettre à jour le nombre d\'invités',
          variant: 'destructive'
        });
        return;
      }

      setAdditionalGuests(newGuestCount);
      fetchParticipantCount();
      onRegistrationChange();
      
      toast({
        title: 'Nombre d\'invités mis à jour',
        description: newGuestCount > 0 
          ? `Vous venez maintenant avec ${newGuestCount} invité${newGuestCount > 1 ? 's' : ''}`
          : 'Vous venez seul(e) à l\'événement',
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive'
      });
    }
  };

  const incrementGuests = () => {
    if (additionalGuests < 9) {
      // Vérifier la limite
      if (event?.max_participants) {
        const currentUserAndGuestsCount = 1 + additionalGuests;
        const newTotal = participantCount - currentUserAndGuestsCount + 1 + (additionalGuests + 1);
        if (newTotal > event.max_participants) {
          const available = event.max_participants - (participantCount - currentUserAndGuestsCount) - 1;
          toast({
            title: 'Limite atteinte',
            description: `Places restantes: ${Math.max(0, available)}`,
            variant: 'destructive'
          });
          return;
        }
      }
      handleUpdateGuests(additionalGuests + 1);
    }
  };

  const decrementGuests = () => {
    if (additionalGuests > 0) {
      handleUpdateGuests(additionalGuests - 1);
    }
  };

  // Calculer le nombre maximum d'invités possibles
  const getMaxGuestsAllowed = () => {
    if (!event?.max_participants) return 9; // Par défaut 9 invités max
    if (!isRegistered) {
      // Pour une nouvelle inscription, on compte l'utilisateur + ses invités
      const available = availableSpots || 0;
      return Math.min(9, Math.max(0, available - 1)); // -1 pour l'utilisateur lui-même
    } else {
      // Pour une inscription existante, on doit recalculer
      const currentUserAndGuestsCount = 1 + additionalGuests;
      const available = event.max_participants - (participantCount - currentUserAndGuestsCount) - 1;
      return Math.min(9, Math.max(0, available));
    }
  };

  const maxGuestsAllowed = getMaxGuestsAllowed();

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
      <div className="border border-getigne-100 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Inscription à l'événement</h3>
          <div className="text-getigne-500 text-sm flex items-center">
            <Users size={16} className="mr-1" />
            <span>
              {participantCount} participant{participantCount > 1 ? 's' : ''}
              {event?.max_participants && ` / ${event.max_participants}`}
              {availableSpots !== null && availableSpots > 0 && (
                <span className="text-green-600 ml-1">({availableSpots} place{availableSpots > 1 ? 's' : ''} restante{availableSpots > 1 ? 's' : ''})</span>
              )}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-3 text-amber-600 bg-amber-50 p-2 rounded">
          <Users size={18} />
          <span>Événement réservé aux adhérents</span>
        </div>
        
        <p className="text-getigne-700 mb-3 text-sm">Pour vous inscrire à cet événement, vous devez être adhérent de l'association.</p>
        
        <Button 
          asChild
          className="w-full bg-getigne-accent hover:bg-getigne-accent/90"
        >
          <Link to={Routes.JOIN}>Devenir adhérent</Link>
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
          
          {/* Sélecteur d'invités additionnels */}
          <div className="mb-3 p-3 bg-getigne-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-getigne-700">
                Invités additionnels
              </span>
              <span className="text-xs text-getigne-500">
                {additionalGuests}/9
              </span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={decrementGuests}
                disabled={additionalGuests === 0}
                className="h-8 w-8 p-0"
              >
                <Minus size={16} />
              </Button>
              <span className="text-lg font-semibold min-w-[2rem] text-center">
                {additionalGuests}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={incrementGuests}
                disabled={additionalGuests >= maxGuestsAllowed}
                className="h-8 w-8 p-0"
              >
                <Plus size={16} />
              </Button>
            </div>
            {additionalGuests > 0 && (
              <p className="text-xs text-getigne-600 mt-2 text-center">
                Vous venez avec {additionalGuests} invité{additionalGuests > 1 ? 's' : ''}
              </p>
            )}
            {event?.max_participants && maxGuestsAllowed === 0 && (
              <p className="text-xs text-red-600 mt-2 text-center">
                Plus de places disponibles pour des invités
              </p>
            )}
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
        <div>
          {event?.max_participants && participantCount >= event.max_participants ? (
            <div className="flex items-center gap-2 mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">
              <X size={16} />
              <span>Événement complet ({participantCount}/{event.max_participants} participants)</span>
            </div>
          ) : null}
          
          {/* Sélecteur d'invités additionnels pour l'inscription */}
          <div className="mb-3 p-3 bg-getigne-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-getigne-700">
                Invités additionnels
              </span>
              <span className="text-xs text-getigne-500">
                {additionalGuests}/{maxGuestsAllowed}
              </span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdditionalGuests(Math.max(0, additionalGuests - 1))}
                disabled={additionalGuests === 0}
                className="h-8 w-8 p-0"
              >
                <Minus size={16} />
              </Button>
              <span className="text-lg font-semibold min-w-[2rem] text-center">
                {additionalGuests}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newCount = additionalGuests + 1;
                  if (event?.max_participants) {
                    const totalWithUserAndGuests = participantCount + 1 + newCount;
                    if (totalWithUserAndGuests > event.max_participants) {
                      toast({
                        title: 'Limite atteinte',
                        description: `Places restantes: ${availableSpots || 0}`,
                        variant: 'destructive'
                      });
                      return;
                    }
                  }
                  setAdditionalGuests(Math.min(maxGuestsAllowed, newCount));
                }}
                disabled={additionalGuests >= maxGuestsAllowed || (event?.max_participants && participantCount >= event.max_participants)}
                className="h-8 w-8 p-0"
              >
                <Plus size={16} />
              </Button>
            </div>
            {additionalGuests > 0 && (
              <p className="text-xs text-getigne-600 mt-2 text-center">
                Vous viendrez avec {additionalGuests} invité{additionalGuests > 1 ? 's' : ''}
              </p>
            )}
            {event?.max_participants && maxGuestsAllowed === 0 && availableSpots === 0 && (
              <p className="text-xs text-red-600 mt-2 text-center">
                Événement complet
              </p>
            )}
            {event?.max_participants && maxGuestsAllowed > 0 && availableSpots !== null && (
              <p className="text-xs text-getigne-500 mt-2 text-center">
                {availableSpots - additionalGuests - 1} place{availableSpots - additionalGuests - 1 > 1 ? 's' : ''} restante{availableSpots - additionalGuests - 1 > 1 ? 's' : ''} après votre inscription
              </p>
            )}
          </div>
          
          <Button 
            className="w-full bg-getigne-accent hover:bg-getigne-accent/90"
            onClick={handleRegister}
            disabled={registering || (event?.max_participants && availableSpots !== null && availableSpots === 0)}
          >
            {registering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            S'inscrire{additionalGuests > 0 ? ` avec ${additionalGuests} invité${additionalGuests > 1 ? 's' : ''}` : ''}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EventRegistration;

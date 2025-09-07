
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const useEventDetails = (
  id: string | undefined, 
  slug: string | undefined, 
  refreshRegistrations: boolean
) => {
  const [eventId, setEventId] = useState<string | null>(null);
  
  // Fonction de log pour le débogage
  const logDebug = (message: string, data?: any) => {
    if (data) {
      console.log(`[useEventDetails] ${message}:`, data);
    } else {
      console.log(`[useEventDetails] ${message}`);
    }
  };

  // Détermine si nous avons un ID ou un slug
  useEffect(() => {
    // Vérifie si nous avons un ID ou un slug
    if (id) {
      // Vérifie si l'ID est un UUID (36 caractères avec des tirets)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (isUuid) {
        logDebug("Setting event ID from UUID param", id);
        setEventId(id);
      } else {
        // Si ce n'est pas un UUID, c'est probablement un slug
        logDebug("ID param is not a UUID, treating as slug", id);
      }
    }
  }, [id]);

  logDebug('Params received', { id, slug });
  
  // Si nous avons un slug, récupérer d'abord l'ID réel
  const { data: slugData, isLoading: isLoadingSlug, error: slugError } = useQuery({
    queryKey: ['event-slug', id, slug],
    queryFn: async () => {
      const slugToUse = slug || (!eventId ? id : null);
      if (!slugToUse) return null;
      
      logDebug("Fetching event by slug", slugToUse);
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slugToUse)
        .maybeSingle();
      
      if (error) {
        logDebug("Error fetching event by slug", error);
        throw error;
      }
      
      logDebug("Found event by slug", data);
      return data;
    },
    enabled: !!slug || (!!id && !eventId),
  });

  // Une fois que nous avons l'ID (soit directement, soit à partir du slug), récupérer les détails de l'événement
  useEffect(() => {
    if (slugData && slugData.id) {
      logDebug("Setting event ID from slug data", slugData.id);
      setEventId(slugData.id);
    }
  }, [slugData]);

  const { data: event, isLoading: isLoadingEvent, error: eventError } = useQuery({
    queryKey: ['event', eventId, refreshRegistrations],
    queryFn: async () => {
      if (!eventId) return null;
      
      logDebug("Fetching event details by ID", eventId);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();
      
      if (error) {
        logDebug("Error fetching event details", error);
        throw error;
      }
      
      logDebug("Found event details", data);
      return data;
    },
    enabled: !!eventId,
  });

  const isLoading = isLoadingSlug || isLoadingEvent || (!eventId && !slugError);
  const error = slugError || eventError;

  // Format date if available
  let formattedDate = '';
  let formattedTime = '';
  let isPastEvent = false;

  if (event) {
    const eventDate = new Date(event.date);
    formattedDate = format(eventDate, "PPPP", { locale: fr });
    formattedTime = format(eventDate, "HH'h'mm", { locale: fr });
    isPastEvent = new Date() > eventDate;
  }

  return {
    event,
    eventId,
    isLoading,
    error,
    formattedDate,
    formattedTime,
    isPastEvent
  };
};

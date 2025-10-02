
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

  // Détermine si nous avons un ID ou un slug
  useEffect(() => {
    // Vérifie si nous avons un ID ou un slug
    if (id) {
      // Vérifie si l'ID est un UUID (36 caractères avec des tirets)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (isUuid) {
        setEventId(id);
      }
    }
  }, [id]);
 
  // Si nous avons un slug, récupérer d'abord l'ID réel
  const { data: slugData, isLoading: isLoadingSlug, error: slugError } = useQuery({
    queryKey: ['event-slug', id, slug],
    queryFn: async () => {
      const slugToUse = slug || (!eventId ? id : null);
      if (!slugToUse) return null;
      
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slugToUse)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    enabled: !!slug || (!!id && !eventId),
  });

  // Une fois que nous avons l'ID (soit directement, soit à partir du slug), récupérer les détails de l'événement
  useEffect(() => {
    if (slugData && slugData.id) {
      setEventId(slugData.id);
    }
  }, [slugData]);

  const { data: event, isLoading: isLoadingEvent, error: eventError } = useQuery({
    queryKey: ['event', eventId, refreshRegistrations],
    queryFn: async () => {
      if (!eventId) return null;
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
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

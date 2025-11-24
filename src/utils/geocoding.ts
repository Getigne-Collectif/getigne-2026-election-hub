/**
 * Utilitaire pour la géocodification d'adresses via Supabase Edge Function
 * (qui utilise l'API Google Maps Geocoding côté serveur)
 */

import { supabase } from '@/integrations/supabase/client';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

/**
 * Géocode une adresse en utilisant la Edge Function Supabase
 * @param address L'adresse à géocoder
 * @returns Les coordonnées (latitude, longitude) et l'adresse formatée
 * @throws Error en cas d'erreur
 */
export const geocodeAddress = async (
  address: string
): Promise<GeocodingResult> => {
  if (!address || address.trim().length === 0) {
    throw new Error('L\'adresse ne peut pas être vide');
  }

  try {
    const { data, error } = await supabase.functions.invoke('geocode-address', {
      body: { address: address.trim() },
    });

    if (error) {
      console.error('Erreur lors de l\'appel à la Edge Function:', error);
      throw new Error(error.message || 'Erreur lors de la géocodification');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      formattedAddress: data.formattedAddress,
    };
  } catch (error: any) {
    console.error('Erreur lors de la géocodification:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erreur inconnue lors de la géocodification');
  }
};



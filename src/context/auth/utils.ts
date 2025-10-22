
import { supabase } from '../../integrations/supabase/client';
import { Profile } from './types';
import { User } from '@supabase/supabase-js';

export const fetchUserRoles = async (userId: string): Promise<string[]> => {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout after 10s')), 10000);
    });

    const queryPromise = supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const { data: rolesData, error: rolesError } = await Promise.race([
      queryPromise,
      timeoutPromise
    ]) as any;

    if (rolesError) {
      console.warn('Erreur lors de la récupération des rôles:', rolesError);
      return [];
    }

    return rolesData?.map(r => r.role) || [];
  } catch (error) {
    console.warn('Timeout ou erreur lors de la récupération des rôles:', error);
    return [];
  }
};

export const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout after 3s')), 3000);
    });

    const queryPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: profileData, error: profileError } = await Promise.race([
      queryPromise,
      timeoutPromise
    ]) as any;

    if (profileError) {
      return null;
    }

    return profileData;
  } catch (error) {
    return null;
  }
};

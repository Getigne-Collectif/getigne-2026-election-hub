
import { supabase } from '../../integrations/supabase/client';
import { Profile } from './types';
import { User } from '@supabase/supabase-js';

export const fetchUserRoles = async (userId: string): Promise<string[]> => {
  try {
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (rolesError) {
      console.error('[AUTH] Error fetching user roles:', rolesError);
      return [];
    }

    return rolesData.map(r => r.role);
  } catch (error) {
    console.error('[AUTH] Unexpected error fetching roles:', error);
    return [];
  }
};

export const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[AUTH] Error fetching profile:', profileError);
      return null;
    }

    return profileData;
  } catch (error) {
    console.error('[AUTH] Unexpected error fetching profile:', error);
    return null;
  }
};

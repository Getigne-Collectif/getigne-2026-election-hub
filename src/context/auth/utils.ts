
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

export const calculateSessionRefreshTimer = (expiresAt: number): number => {
  // Calculate time until expiration in milliseconds
  const expiresIn = expiresAt * 1000 - Date.now();
  
  // If expires in less than a minute, return 0 (refresh immediately)
  if (expiresIn <= 60000) {
    return 0;
  }
  
  // Refresh 5 minutes before expiration
  return Math.max(0, expiresIn - 300000);
};

export const fetchCompleteUserData = async (
  user: User, 
  onProfileFetched: (profile: Profile | null) => void,
  onRolesFetched: (roles: string[]) => void
) => {
  console.log('[AUTH] Fetching complete user data for:', user.id);
  
  try {
    // Fetch roles
    const roles = await fetchUserRoles(user.id);
    console.log('[AUTH] Fetched user roles:', roles);
    onRolesFetched(roles);

    // Fetch profile
    const profile = await fetchUserProfile(user.id);
    if (profile) {
      console.log('[AUTH] Fetched user profile:', profile);
      onProfileFetched(profile);
    }
  } catch (error) {
    console.error('[AUTH] Error during user data fetch:', error);
  }
};

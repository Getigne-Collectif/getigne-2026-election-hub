
import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import AuthContext from './AuthContext';
import { Profile, IAuthContext } from './types';
import { 
  fetchUserRoles, 
  fetchUserProfile, 
  calculateSessionRefreshTimer, 
  fetchCompleteUserData 
} from './utils';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionExpiryTimer, setSessionExpiryTimer] = useState<NodeJS.Timeout | null>(null);
  const [visibilityState, setVisibilityState] = useState<string>(document.visibilityState);
  const { toast } = useToast();

  // Function to refresh user roles
  const refreshUserRoles = async () => {
    if (!user) {
      console.log('[AUTH] Attempt to refresh roles without logged in user');
      return;
    }
    
    console.log('[AUTH] Refreshing user roles for:', user.id);
    
    try {
      // Get active session to ensure tokens are valid
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[AUTH] Error getting session:', sessionError);
        return;
      }
      
      if (!sessionData.session) {
        console.log('[AUTH] Session expired, login required');
        setUser(null);
        setUserRoles([]);
        setProfile(null);
        setAuthChecked(true);
        return;
      }
      
      // Fetch user roles with active session
      const roles = await fetchUserRoles(user.id);
      console.log('[AUTH] Updated user roles:', roles);
      setUserRoles(roles);
      
      // Fetch user profile
      const profileData = await fetchUserProfile(user.id);
      if (profileData) {
        console.log('[AUTH] Updated user profile:', profileData);
        setProfile(profileData);
        setIsMember(profileData.is_member === true);
      }
      
      // Update timestamps for automatic refresh
      if (sessionData.session?.expires_at) {
        setupSessionRefreshTimer(sessionData.session.expires_at);
      }
    } catch (error) {
      console.error('[AUTH] General error refreshing roles:', error);
    }
  };

  // Function to setup a timer for refreshing based on token expiration
  const setupSessionRefreshTimer = (expiresAt: number) => {
    if (sessionExpiryTimer) {
      clearTimeout(sessionExpiryTimer);
    }
    
    const refreshTime = calculateSessionRefreshTimer(expiresAt);
    
    // If token is about to expire, refresh immediately
    if (refreshTime === 0) {
      console.log('[AUTH] Token about to expire, refreshing immediately');
      refreshUserRoles();
      return;
    }
    
    console.log(`[AUTH] Scheduling role refresh in ${Math.floor(refreshTime/1000/60)} minutes`);
    
    const timer = setTimeout(() => {
      console.log('[AUTH] Executing scheduled role refresh');
      refreshUserRoles();
    }, refreshTime);
    
    setSessionExpiryTimer(timer);
  };

  const fetchUserData = async (currentUser: User, session: any) => {
    if (!currentUser) {
      setLoading(false);
      setAuthChecked(true);
      return;
    }
    
    console.log('[AUTH] Fetching complete user data for:', currentUser.id);
    setUser(currentUser);
    
    try {
      await fetchCompleteUserData(
        currentUser,
        (profileData) => {
          if (profileData) {
            setProfile(profileData);
            setIsMember(profileData.is_member === true);
          }
        },
        (roles) => {
          setUserRoles(roles);
        }
      );
      
      // Setup timer for token refresh
      if (session?.expires_at) {
        setupSessionRefreshTimer(session.expires_at);
      }
    } catch (error) {
      console.error('[AUTH] Error during user data fetch:', error);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  // Handle tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('[AUTH] Visibility changed:', document.visibilityState);
      setVisibilityState(document.visibilityState);
      
      if (document.visibilityState === 'visible' && user) {
        console.log('[AUTH] Tab became visible, refreshing user data');
        refreshUserRoles();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Initial authentication setup
  useEffect(() => {
    setLoading(true);
    
    const getInitialSession = async () => {
      try {
        console.log('[AUTH] Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AUTH] Error getting session:', error);
          setLoading(false);
          setAuthChecked(true);
          return;
        }

        if (session?.user) {
          console.log('[AUTH] Initial session found, fetching user data for:', session.user.id);
          await fetchUserData(session.user, session);
        } else {
          console.log('[AUTH] No initial session found');
          setLoading(false);
          setAuthChecked(true);
        }
      } catch (error) {
        console.error('[AUTH] Unexpected error during session initialization:', error);
        setLoading(false);
        setAuthChecked(true);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH] Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[AUTH] User signed in, fetching data for:', session.user.id);
        await fetchUserData(session.user, session);
      } else if (event === 'SIGNED_OUT') {
        console.log('[AUTH] User signed out, clearing data');
        setUser(null);
        setUserRoles([]);
        setIsMember(false);
        setProfile(null);
        setAuthChecked(true);
        setLoading(false);
        
        // Clean up timer on logout
        if (sessionExpiryTimer) {
          clearTimeout(sessionExpiryTimer);
          setSessionExpiryTimer(null);
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('[AUTH] Token refreshed, updating user data for:', session.user.id);
        await fetchUserData(session.user, session);
      }
    });

    getInitialSession();

    // Clean up listeners on component unmount
    return () => {
      authListener.subscription.unsubscribe();
      if (sessionExpiryTimer) {
        clearTimeout(sessionExpiryTimer);
      }
    };
  }, []);

  // Handle network reconnection
  useEffect(() => {
    const handleOnline = () => {
      console.log('[AUTH] Network connection restored');
      if (user) {
        console.log('[AUTH] Refreshing user data after reconnection');
        refreshUserRoles();
      }
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [user]);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Setup refresh based on expiration if login successful
      if (data.session?.expires_at) {
        setupSessionRefreshTimer(data.session.expires_at);
      }

    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: 'Compte créé avec succès',
        description: 'Vérifiez votre e-mail pour confirmer votre compte.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur d\'inscription',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clean up timer on logout
      if (sessionExpiryTimer) {
        clearTimeout(sessionExpiryTimer);
        setSessionExpiryTimer(null);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Erreur de déconnexion',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const signInWithProvider = async (provider: 'discord' | 'facebook' | 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/auth/callback',
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: `Erreur lors de la connexion avec ${provider}`,
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const isAdmin = userRoles.includes('admin');
  const isModerator = userRoles.includes('moderator') || isAdmin;

  const value: IAuthContext = {
    user,
    profile,
    signIn,
    signUp,
    signOut,
    loading,
    isAdmin,
    isModerator,
    isMember,
    userRoles,
    authChecked,
    setUser,
    signInWithProvider,
    refreshUserRoles,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

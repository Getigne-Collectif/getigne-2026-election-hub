
import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import AuthContext from './AuthContext';
import { Profile, IAuthContext } from './types';
import { fetchUserRoles, fetchUserProfile } from './utils';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { toast } = useToast();

  // Function to refresh user roles
  const refreshUserRoles = async () => {
    if (!user) {
      return;
    }
    
    try {
      // Fetch user roles
      const roles = await fetchUserRoles(user.id);
      setUserRoles(roles);
      
      // Fetch user profile
      const profileData = await fetchUserProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        setIsMember(profileData.is_member === true);
      }
    } catch (error) {
      console.error('[AUTH] Error refreshing roles:', error);
    }
  };

  // Initial authentication setup
  useEffect(() => {
    setLoading(true);
    
    // Set up the auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH] Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await refreshUserRoles();
        setLoading(false);
        setAuthChecked(true);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRoles([]);
        setProfile(null);
        setIsMember(false);
        setLoading(false);
        setAuthChecked(true);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
        await refreshUserRoles();
      }
    });
    
    // Check for an existing session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AUTH] Error getting session:', error);
          setLoading(false);
          setAuthChecked(true);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await refreshUserRoles();
        }
        
        setLoading(false);
        setAuthChecked(true);
      } catch (error) {
        console.error('[AUTH] Error during session initialization:', error);
        setLoading(false);
        setAuthChecked(true);
      }
    };

    getInitialSession();

    // Clean up listeners on component unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

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

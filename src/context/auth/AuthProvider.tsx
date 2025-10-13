import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import AuthContext from './AuthContext';
import { Profile, IAuthContext } from './types';
import { fetchUserRoles, fetchUserProfile } from './utils';
import { usePostHog } from '@/hooks/usePostHog';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const posthog = usePostHog();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isInvitedUser, setIsInvitedUser] = useState(false);

  const loadUserData = async (currentUser: User) => {
    try {
      const [roles, profileData] = await Promise.all([
        fetchUserRoles(currentUser.id),
        fetchUserProfile(currentUser.id)
      ]);
      
      setUserRoles(roles);
      
      if (profileData) {
        setProfile(profileData);
        setIsMember(profileData.is_member === true);
      }

      if (posthog?.identify) {
        posthog.identify(currentUser.id, {
          email: currentUser.email,
          roles: roles.join(','),
          is_member: profileData?.is_member || false
        });
      }

      return roles;
    } catch (error) {
      return [];
    }
  };

  const refreshUserRoles = async () => {
    if (!user) return [];
    return loadUserData(user);
  };

  useEffect(() => {
    let cancelled = false;
    let initialized = false;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (cancelled) {
          return;
        }
        
        if (error) {
          setLoading(false);
          setAuthChecked(true);
          initialized = true;
          return;
        }

        if (session?.user) {
          setUser(session.user);
          
          const isNewInvitedUser = session.user.email_confirmed_at && !session.user.last_sign_in_at;
          setIsInvitedUser(isNewInvitedUser);
          
          await loadUserData(session.user);
          
          if (cancelled) {
            return;
          }
        }
        
        setLoading(false);
        setAuthChecked(true);
        initialized = true;
      } catch (error) {
        if (!cancelled) {
          setLoading(false);
          setAuthChecked(true);
          initialized = true;
        }
      }
    };

    initAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) {
        return;
      }

      if (!initialized && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        
        const isNewInvitedUser = session.user.email_confirmed_at && !session.user.last_sign_in_at;
        setIsInvitedUser(isNewInvitedUser);
        
        await loadUserData(session.user);
        
        const loginMethod = session.user.app_metadata?.provider || 'email';
        if (posthog?.capture) {
          posthog.capture('user_login', {
            user_id: session.user.id,
            email: session.user.email,
            is_new_user: isNewInvitedUser,
            login_method: loginMethod,
            timestamp: new Date().toISOString()
          });
        }
        
        setLoading(false);
        setAuthChecked(true);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRoles([]);
        setProfile(null);
        setIsMember(false);
        setIsInvitedUser(false);
        setLoading(false);
        setAuthChecked(true);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
        await loadUserData(session.user);
      }
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

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

      if (posthog?.capture) {
        posthog.capture('user_registration', {
          email: email,
          first_name: firstName,
          last_name: lastName,
          registration_method: 'email',
          timestamp: new Date().toISOString()
        });
      }

      await supabase.auth.signOut();

      toast({
        title: 'Inscription presque terminée !',
        description: 'Vérifiez votre boîte mail et cliquez sur le lien de confirmation pour activer votre compte.',
        duration: 8000,
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
      if (posthog?.capture) {
        posthog.capture('user_logout', {
          user_id: user?.id,
          timestamp: new Date().toISOString()
        });
      }
      if (posthog?.reset) {
        posthog.reset();
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
      if (posthog?.capture) {
        posthog.capture('oauth_login_attempt', {
          provider: provider,
          timestamp: new Date().toISOString()
        });
      }

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

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setIsInvitedUser(false);
      
      toast({
        title: 'Mot de passe mis à jour',
        description: 'Votre mot de passe a été mis à jour avec succès.',
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: 'Erreur de mise à jour du mot de passe',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/reset-password',
      });
      
      if (error) throw error;
      
      toast({
        title: 'Email de réinitialisation envoyé',
        description: 'Vérifiez votre email pour réinitialiser votre mot de passe.',
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: 'Erreur d\'envoi',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateProfile = async (profileData: Partial<Profile>) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);
      
      if (error) throw error;
      
      if (profile) {
        setProfile({
          ...profile,
          ...profileData
        });
      }
      
      toast({
        title: 'Profil mis à jour',
        description: 'Votre profil a été mis à jour avec succès.',
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: 'Erreur de mise à jour du profil',
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
    isInvitedUser,
    setUser,
    signInWithProvider,
    refreshUserRoles,
    updatePassword,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

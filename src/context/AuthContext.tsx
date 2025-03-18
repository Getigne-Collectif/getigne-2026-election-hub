
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: any;
  loading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: 'discord' | 'facebook' | 'google') => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  setUser: () => {},
  signOut: async () => {},
  signInWithProvider: async () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Fonction pour récupérer le profil utilisateur
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      console.log('Profile data retrieved:', data);
      return data;
    } catch (error) {
      console.error('Exception when fetching profile:', error);
      return null;
    }
  };

  // Initialise l'état d'authentification au chargement
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Session found, user is authenticated:', session.user.id);
          setUser(session.user);
          
          const profileData = await fetchUserProfile(session.user.id);
          if (profileData) {
            console.log('Setting profile data:', profileData);
            setProfile(profileData);
          }
        } else {
          console.log('No session found, user is not authenticated');
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
        setAuthInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Écoute les changements d'état d'authentification après l'initialisation
  useEffect(() => {
    if (!authInitialized) return;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (session?.user) {
          setUser(session.user);
          
          // Important: await pour s'assurer que le profil est chargé avant de continuer
          const profileData = await fetchUserProfile(session.user.id);
          console.log('Profile data after auth state change:', profileData);
          
          if (profileData) {
            setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [authInitialized]);

  const signOut = async () => {
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      
      console.log('Sign out successful');
      setUser(null);
      setProfile(null);
      
      // Forcer un rechargement de la page pour effacer toutes les données en cache
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  };

  const signInWithProvider = async (provider: 'discord' | 'facebook' | 'google'): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth`
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error(`Erreur de connexion avec ${provider}:`, error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        profile, 
        loading, 
        setUser, 
        signOut, 
        signInWithProvider 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

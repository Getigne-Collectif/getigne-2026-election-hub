
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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        // Récupérer la session actuelle
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Session found, user is authenticated:', session.user.id);
          setUser(session.user);
          
          // Récupérer le profil utilisateur
          const profileData = await fetchUserProfile(session.user.id);
          if (profileData) {
            console.log('Setting profile data:', profileData);
            setProfile(profileData);
          } else {
            console.log('No profile data found, setting profile to null');
            setProfile(null);
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
      }
    };

    initAuth();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (session?.user) {
          setUser(session.user);
          const profileData = await fetchUserProfile(session.user.id);
          console.log('Profile data after auth state change:', profileData);
          setProfile(profileData);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      
      console.log('Sign out successful');
      // Explicitement effacer l'état
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
      // Ne retourne rien pour correspondre au type Promise<void>
    } catch (error) {
      console.error(`Erreur de connexion avec ${provider}:`, error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, setUser, signOut, signInWithProvider }}>
      {children}
    </AuthContext.Provider>
  );
};

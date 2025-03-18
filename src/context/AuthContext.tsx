
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

type Role = 'admin' | 'moderator' | 'user';

interface AuthContextType {
  user: User | null;
  profile: any;
  loading: boolean;
  userRoles: Role[];
  isAdmin: boolean;
  isModerator: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: 'discord' | 'facebook' | 'google') => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  userRoles: [],
  isAdmin: false,
  isModerator: false,
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
  const [userRoles, setUserRoles] = useState<Role[]>([]);
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

  // Fonction pour récupérer les rôles de l'utilisateur
  const fetchUserRoles = async (userId: string): Promise<Role[]> => {
    try {
      console.log('Fetching roles for user:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        // Si la table n'existe pas encore ou autre erreur
        console.error('Error fetching user roles:', error);
        return [];
      }
      
      // Extraire la liste des rôles
      const roles = data.map(item => item.role as Role);
      console.log('User roles retrieved:', roles);
      return roles;
    } catch (error) {
      console.error('Exception when fetching user roles:', error);
      return [];
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
          
          const roles = await fetchUserRoles(session.user.id);
          setUserRoles(roles);
        } else {
          console.log('No session found, user is not authenticated');
          setUser(null);
          setProfile(null);
          setUserRoles([]);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setProfile(null);
        setUserRoles([]);
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
          
          // Récupérer les rôles de l'utilisateur
          const roles = await fetchUserRoles(session.user.id);
          setUserRoles(roles);
        } else {
          setUser(null);
          setProfile(null);
          setUserRoles([]);
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
      setUserRoles([]);
      
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

  // Vérifier si l'utilisateur a un rôle spécifique
  const isAdmin = userRoles.includes('admin');
  const isModerator = userRoles.includes('moderator') || isAdmin; // Un admin est aussi modérateur

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        profile, 
        loading, 
        userRoles,
        isAdmin,
        isModerator,
        setUser, 
        signOut, 
        signInWithProvider 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

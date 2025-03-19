
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  is_member: boolean;
  status?: string;
  email?: string;
  [key: string]: any;
}

interface IAuthContext {
  user: any | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isMember: boolean;
  userRoles: string[];
  authChecked: boolean;
  setUser: (user: any) => void;
  signInWithProvider: (provider: 'discord' | 'facebook' | 'google') => Promise<void>;
  refreshUserRoles: () => Promise<void>;
}

const AuthContext = createContext<IAuthContext>({
  user: null,
  profile: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  loading: true,
  isAdmin: false,
  isModerator: false,
  isMember: false,
  userRoles: [],
  authChecked: false,
  setUser: () => {},
  signInWithProvider: async () => {},
  refreshUserRoles: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionExpiryTimer, setSessionExpiryTimer] = useState<NodeJS.Timeout | null>(null);
  const [visibilityState, setVisibilityState] = useState<string>(document.visibilityState);
  const { toast } = useToast();

  // Fonction pour rafraîchir les rôles de l'utilisateur
  const refreshUserRoles = async () => {
    if (!user) {
      console.log('[AUTH] Tentative de rafraîchissement des rôles sans utilisateur connecté');
      return;
    }
    
    console.log('[AUTH] Refreshing user roles for:', user.id);
    
    try {
      // Récupérer la session active pour s'assurer que les tokens sont valides
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[AUTH] Erreur lors de la récupération de la session:', sessionError);
        return;
      }
      
      if (!sessionData.session) {
        console.log('[AUTH] Session expirée, reconnexion nécessaire');
        setUser(null);
        setUserRoles([]);
        setProfile(null);
        setAuthChecked(true);
        return;
      }
      
      // Récupérer les rôles avec la session active
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('[AUTH] Error fetching user roles:', rolesError);
        // Si l'erreur est liée à l'authentification, on réinitialise l'état
        if (rolesError.code === '401' || rolesError.code === 'PGRST301') {
          console.log('[AUTH] Erreur d\'authentification lors de la récupération des rôles');
          return;
        }
      } else {
        const roles = rolesData.map(r => r.role);
        console.log('[AUTH] Updated user roles:', roles);
        setUserRoles(roles);
      }
      
      // Récupérer le profil utilisateur
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('[AUTH] Error fetching profile:', profileError);
        // Si l'erreur est liée à l'authentification, on réinitialise l'état
        if (profileError.code === '401' || profileError.code === 'PGRST301') {
          console.log('[AUTH] Erreur d\'authentification lors de la récupération du profil');
          return;
        }
      } else if (profileData) {
        console.log('[AUTH] Updated user profile:', profileData);
        setProfile(profileData);
        setIsMember(profileData.is_member === true);
      }
      
      // Mettre à jour les timestamps de la session pour le rafraîchissement automatique
      if (sessionData.session?.expires_at) {
        setupSessionRefreshTimer(sessionData.session.expires_at);
      }
    } catch (error) {
      console.error('[AUTH] Erreur générale lors du rafraîchissement des rôles:', error);
    }
  };

  // Fonction pour configurer un minuteur pour le rafraîchissement basé sur l'expiration du token
  const setupSessionRefreshTimer = (expiresAt: number) => {
    if (sessionExpiryTimer) {
      clearTimeout(sessionExpiryTimer);
    }
    
    // Calculer le temps restant avant expiration (en ms)
    const expiresIn = expiresAt * 1000 - Date.now();
    
    // Si le token a déjà expiré ou est proche de l'expiration, rafraîchir immédiatement
    if (expiresIn <= 60000) {
      console.log('[AUTH] Token proche de l\'expiration, rafraîchissement immédiat');
      refreshUserRoles();
      return;
    }
    
    // Rafraîchir les rôles 5 minutes avant l'expiration du token
    const refreshTime = expiresIn - 300000; // 5 minutes avant l'expiration
    console.log(`[AUTH] Programmation du rafraîchissement des rôles dans ${Math.floor(refreshTime/1000/60)} minutes`);
    
    const timer = setTimeout(() => {
      console.log('[AUTH] Exécution du rafraîchissement programmé des rôles');
      refreshUserRoles();
    }, refreshTime);
    
    setSessionExpiryTimer(timer);
  };

  const fetchUserData = async (currentUser: any, session: any) => {
    if (!currentUser) {
      setLoading(false);
      setAuthChecked(true);
      return;
    }
    
    console.log('[AUTH] Fetching complete user data for:', currentUser.id);
    setUser(currentUser);
    
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id);

      if (rolesError) {
        console.error('[AUTH] Error fetching user roles:', rolesError);
      } else {
        const roles = rolesData.map(r => r.role);
        console.log('[AUTH] Fetched user roles:', roles);
        setUserRoles(roles);
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.error('[AUTH] Error fetching profile:', profileError);
      } else if (profileData) {
        console.log('[AUTH] Fetched user profile:', profileData);
        setProfile(profileData);
        setIsMember(profileData.is_member === true);
      }
      
      // Configurer le minuteur pour le rafraîchissement basé sur l'expiration du token
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

  // Gestion du changement de visibilité de l'onglet
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
        
        // Nettoyer le minuteur lors de la déconnexion
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

    // Nettoyer les écouteurs lors du démontage du composant
    return () => {
      authListener.subscription.unsubscribe();
      // Nettoyer le minuteur lors du démontage du composant
      if (sessionExpiryTimer) {
        clearTimeout(sessionExpiryTimer);
      }
    };
  }, []);

  // Gérer la reconnexion au réseau
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

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Configurer le rafraîchissement basé sur l'expiration si la connexion réussit
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
      // Nettoyer le minuteur lors de la déconnexion
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

  const value = {
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

export default AuthContext;

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
  const { toast } = useToast();

  const refreshUserRoles = async () => {
    if (!user) return;
    
    console.log('Refreshing user roles for:', user.id);
    
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        return;
      }
      
      const roles = rolesData.map(r => r.role);
      console.log('Updated user roles:', roles);
      setUserRoles(roles);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }
      
      if (profileData) {
        console.log('Updated user profile:', profileData);
        setProfile(profileData);
        setIsMember(profileData.is_member === true);
      }
    } catch (error) {
      console.error('Error during roles refresh:', error);
    }
  };

  const fetchUserData = async (currentUser: any) => {
    if (!currentUser) {
      setLoading(false);
      setAuthChecked(true);
      return;
    }
    
    console.log('Fetching complete user data for:', currentUser.id);
    setUser(currentUser);
    
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      } else {
        const roles = rolesData.map(r => r.role);
        console.log('Fetched user roles:', roles);
        setUserRoles(roles);
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profileData) {
        console.log('Fetched user profile:', profileData);
        setProfile(profileData);
        setIsMember(profileData.is_member === true);
      }
    } catch (error) {
      console.error('Error during user data fetch:', error);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    setLoading(true);
    
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          setAuthChecked(true);
          return;
        }

        if (session?.user) {
          console.log('Initial session found, fetching user data for:', session.user.id);
          await fetchUserData(session.user);
        } else {
          console.log('No initial session found');
          setLoading(false);
          setAuthChecked(true);
        }
      } catch (error) {
        console.error('Unexpected error during session initialization:', error);
        setLoading(false);
        setAuthChecked(true);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, fetching data for:', session.user.id);
        await fetchUserData(session.user);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing data');
        setUser(null);
        setUserRoles([]);
        setIsMember(false);
        setProfile(null);
        setAuthChecked(true);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('Token refreshed, updating user data for:', session.user.id);
        await fetchUserData(session.user);
      }
    });

    getInitialSession();

    return () => {
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

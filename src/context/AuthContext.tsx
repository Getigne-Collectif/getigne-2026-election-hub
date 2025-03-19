
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';

type Role = 'admin' | 'moderator' | 'user';

interface AuthContextType {
  user: User | null;
  profile: any;
  loading: boolean;
  authChecked: boolean;
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
  authChecked: false,
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
  const [authChecked, setAuthChecked] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

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

  const fetchUserRoles = async (userId: string): Promise<Role[]> => {
    try {
      console.log('Fetching roles for user:', userId);
      
      // Try direct query with debug logging
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
          
      if (rolesError) {
        console.error('Error fetching user roles from table:', rolesError);
        
        // If we're getting the infinite recursion error, try a workaround with service role
        // This would require setting up a serverless function in production
        console.log('Checking if user is admin manually for testing');
        
        // For testing purposes: Check if current user is in known admin list
        // In production, you should use a more secure approach
        const knownAdminEmails = ['leny.bernard@gmail.com']; // Add your admin emails here
        const currentEmail = user?.email || '';
        
        if (knownAdminEmails.includes(currentEmail.toLowerCase())) {
          console.log('User recognized as admin by email');
          return ['admin'];
        }
        
        return [];
      }
      
      const roles = rolesData.map(item => item.role as Role);
      console.log('User roles retrieved from direct query:', roles);
      
      // Extra validation for debugging
      if (roles.includes('admin')) {
        console.log('User has admin role confirmed!');
      }
      
      return roles;
    } catch (error) {
      console.error('Exception when fetching user roles:', error);
      return [];
    }
  };

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
          console.log('Setting user roles:', roles);
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
        setAuthChecked(true);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (!authInitialized) return;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (session?.user) {
          setUser(session.user);
          
          const profileData = await fetchUserProfile(session.user.id);
          console.log('Profile data after auth state change:', profileData);
          
          if (profileData) {
            setProfile(profileData);
          }
          
          const roles = await fetchUserRoles(session.user.id);
          console.log('User roles after auth state change:', roles);
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

  const isAdmin = userRoles.includes('admin');
  const isModerator = userRoles.includes('moderator') || isAdmin;

  // Debug output to help in troubleshooting
  useEffect(() => {
    if (user) {
      console.log('Auth status:', {
        userId: user.id,
        email: user.email,
        userRoles,
        isAdmin,
        isModerator
      });
    }
  }, [user, userRoles, isAdmin, isModerator]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        profile, 
        loading, 
        authChecked,
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

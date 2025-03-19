
import { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  is_member: boolean;
  status?: string;
  email?: string;
  [key: string]: any;
}

export interface IAuthContext {
  user: User | null;
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

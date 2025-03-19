
import { createContext } from 'react';
import { IAuthContext } from './types';

// Default values for the context
const defaultAuthContext: IAuthContext = {
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
};

const AuthContext = createContext<IAuthContext>(defaultAuthContext);

export default AuthContext;

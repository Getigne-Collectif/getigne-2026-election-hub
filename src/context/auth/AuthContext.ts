
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
  isInvitedUser: false,
  setUser: () => {},
  signInWithProvider: async () => {},
  refreshUserRoles: async () => {},
  updatePassword: async () => false,
  resetPassword: async () => false,
  updateProfile: async () => false,
};

const AuthContext = createContext<IAuthContext>(defaultAuthContext);

export default AuthContext;

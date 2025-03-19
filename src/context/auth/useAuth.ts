
import { useContext } from 'react';
import AuthContext from './AuthContext';
import type { IAuthContext } from './types';

// Type-safe hook to access auth context
export const useAuth = (): IAuthContext => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;

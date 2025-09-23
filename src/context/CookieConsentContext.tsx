import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CookieConsentContextType {
  hasConsented: boolean | null; // null = pas encore décidé, true = accepté, false = refusé
  acceptCookies: () => void;
  rejectCookies: () => void;
  analyticsEnabled: boolean;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

const COOKIE_CONSENT_KEY = 'getigne-cookie-consent';

export const CookieConsentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);

  // Charger les préférences depuis le localStorage au montage
  useEffect(() => {
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (savedConsent !== null) {
      setHasConsented(savedConsent === 'true');
    }
  }, []);

  const acceptCookies = () => {
    setHasConsented(true);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
  };

  const rejectCookies = () => {
    setHasConsented(false);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'false');
  };

  // Les analytics sont activés seulement si l'utilisateur a accepté les cookies
  const analyticsEnabled = hasConsented === true;

  const value: CookieConsentContextType = {
    hasConsented,
    acceptCookies,
    rejectCookies,
    analyticsEnabled,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = (): CookieConsentContextType => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};

export default CookieConsentContext;

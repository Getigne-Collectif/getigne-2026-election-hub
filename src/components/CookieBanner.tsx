import React from 'react';
import { Button } from '@/components/ui/button';
import { useCookieConsent } from '@/context/CookieConsentContext';

const CookieBanner: React.FC = () => {
  const { hasConsented, acceptCookies, rejectCookies } = useCookieConsent();

  // Ne pas afficher la bannière si l'utilisateur a déjà fait un choix
  if (hasConsented !== null) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/75 backdrop-blur-sm border-t border-gray-200 shadow-sm">
      <div className="container mx-auto px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="text-xs sm:text-sm text-gray-600 flex-1 leading-relaxed">
            Nous utilisons des cookies pour mesurer l'audience de notre site. 
            <a 
              href="/mentions-legales" 
              className="text-brand hover:underline ml-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              En savoir plus
            </a>
          </p>
          
          <div className="flex gap-2 flex-shrink-0 justify-end sm:justify-start">
            <Button
              onClick={rejectCookies}
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1 h-7 flex-1 sm:flex-none sm:w-auto"
            >
              Refuser
            </Button>
            <Button
              onClick={acceptCookies}
              size="sm"
              className="bg-brand hover:bg-brand/90 text-brand-fg text-xs px-3 py-1 h-7 flex-1 sm:flex-none sm:w-auto"
            >
              Accepter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;

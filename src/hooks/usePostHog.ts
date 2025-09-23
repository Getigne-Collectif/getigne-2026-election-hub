import { usePostHog as usePostHogReact } from 'posthog-js/react';
import { useCookieConsent } from '@/context/CookieConsentContext';

export const usePostHog = () => {
  const posthog = usePostHogReact();
  const { analyticsEnabled } = useCookieConsent();

  const capture = (event: string, properties?: Record<string, any>) => {
    if (posthog && analyticsEnabled) {
      posthog.capture(event, properties);
    }
  };

  const identify = (userId: string, properties?: Record<string, any>) => {
    if (posthog && analyticsEnabled) {
      posthog.identify(userId, properties);
    }
  };

  const isFeatureEnabled = (flag: string): boolean => {
    if (posthog && analyticsEnabled) {
      return posthog.isFeatureEnabled(flag);
    }
    return false;
  };

  const setPersonProperties = (properties: Record<string, any>) => {
    if (posthog && analyticsEnabled) {
      posthog.setPersonProperties(properties);
    }
  };

  const reset = () => {
    if (posthog && analyticsEnabled) {
      posthog.reset();
    }
  };

  return {
    capture,
    identify,
    isFeatureEnabled,
    setPersonProperties,
    reset,
    posthog: analyticsEnabled ? posthog : null,
    analyticsEnabled
  };
};

export default usePostHog;

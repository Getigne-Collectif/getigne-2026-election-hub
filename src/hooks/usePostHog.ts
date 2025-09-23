import { usePostHog as usePostHogReact } from 'posthog-js/react';

export const usePostHog = () => {
  const posthog = usePostHogReact();

  const capture = (event: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.capture(event, properties);
    }
  };

  const identify = (userId: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.identify(userId, properties);
    }
  };

  const isFeatureEnabled = (flag: string): boolean => {
    if (posthog) {
      return posthog.isFeatureEnabled(flag);
    }
    return false;
  };

  const setPersonProperties = (properties: Record<string, any>) => {
    if (posthog) {
      posthog.setPersonProperties(properties);
    }
  };

  const reset = () => {
    if (posthog) {
      posthog.reset();
    }
  };

  return {
    capture,
    identify,
    isFeatureEnabled,
    setPersonProperties,
    reset,
    posthog
  };
};

export default usePostHog;

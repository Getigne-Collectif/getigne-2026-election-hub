
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

type AppSettings = {
  showProgram: boolean;
  showCommitteeWorks: boolean;
};

type AppSettingsContextType = {
  settings: AppSettings;
  updateSetting: (key: keyof AppSettings, value: boolean) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

const defaultSettings: AppSettings = {
  showProgram: true,
  showCommitteeWorks: true,
};

const AppSettingsContext = createContext<AppSettingsContextType>({
  settings: defaultSettings,
  updateSetting: async () => false,
  loading: false,
  error: null,
  refresh: async () => {},
});

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isAdmin } = useAuth();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

      if (error) throw error;

      // Convert array to object for easier access
      const settingsObject = { ...defaultSettings };
      data.forEach((setting) => {
        if (setting.key === 'showProgram') {
          settingsObject.showProgram = setting.value === true || setting.value === 'true';
        }
        else if (setting.key === 'showCommitteeWorks') {
          settingsObject.showCommitteeWorks = setting.value === true || setting.value === 'true';
        }
      });

      setSettings(settingsObject);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (key: keyof AppSettings, value: boolean) => {
    if (!isAdmin) {
      console.error('Only admins can update settings');
      return false;
    }

    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value })
        .eq('key', key);

      if (error) throw error;

      // Update local state
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));

      return true;
    } catch (err) {
      console.error(`Error updating setting ${key}:`, err);
      return false;
    }
  };

  return (
    <AppSettingsContext.Provider
      value={{
        settings,
        updateSetting,
        loading,
        error,
        refresh: fetchSettings,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

export const useAppSettings = () => useContext(AppSettingsContext);

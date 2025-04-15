
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppSettings = {
  showProgram: boolean;
  showCommitteeWorks: boolean;
  [key: string]: any;
};

const defaultSettings: AppSettings = {
  showProgram: false,
  showCommitteeWorks: false,
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*');
        
        if (error) throw error;

        const formattedSettings = { ...defaultSettings };
        
        data.forEach((setting) => {
          switch (setting.key) {
            case 'show_program':
            case 'showProgram':
              formattedSettings.showProgram = setting.value === true || 
                (typeof setting.value === 'object' && setting.value !== null && 'enabled' in setting.value 
                  ? setting.value.enabled === true 
                  : false);
              break;
            case 'show_committee_works':
            case 'showCommitteeWorks':
              formattedSettings.showCommitteeWorks = setting.value === true || 
                (typeof setting.value === 'object' && setting.value !== null && 'enabled' in setting.value 
                  ? setting.value.enabled === true 
                  : false);
              break;
            default:
              formattedSettings[setting.key] = setting.value;
          }
        });

        setSettings(formattedSettings);
      } catch (err) {
        console.error('Erreur lors de la récupération des paramètres:', err);
        setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: any) => {
    try {
      let dbKey = key;
      let dbValue = value;
      
      if (key === 'showProgram') {
        dbKey = 'show_program';
        dbValue = { enabled: value };
      } else if (key === 'showCommitteeWorks') {
        dbKey = 'show_committee_works';
        dbValue = { enabled: value };
      }
      
      const { error } = await supabase
        .from('app_settings')
        .update({ value: dbValue })
        .eq('key', dbKey);
      
      if (error) throw error;
      
      setSettings(prev => ({ ...prev, [key]: value }));
      
      return true;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du paramètre:', err);
      return false;
    }
  };

  return { 
    settings, 
    loading, 
    error, 
    updateSetting,
    isLoading: loading, 
    updateSettings: async (newSettings: Partial<AppSettings>) => {
      try {
        for (const [key, value] of Object.entries(newSettings)) {
          await updateSetting(key, value);
        }
        return true;
      } catch (err) {
        console.error('Error updating settings:', err);
        return false;
      }
    },
    refresh: async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('app_settings').select('*');
        if (error) throw error;
        
        const formattedSettings = { ...defaultSettings };
        data.forEach((setting) => {
          switch (setting.key) {
            case 'show_program':
            case 'showProgram':
              formattedSettings.showProgram = setting.value === true || 
                (typeof setting.value === 'object' && setting.value !== null && 'enabled' in setting.value 
                  ? setting.value.enabled === true 
                  : false);
              break;
            case 'show_committee_works':
            case 'showCommitteeWorks':
              formattedSettings.showCommitteeWorks = setting.value === true || 
                (typeof setting.value === 'object' && setting.value !== null && 'enabled' in setting.value 
                  ? setting.value.enabled === true 
                  : false);
              break;
            default:
              formattedSettings[setting.key] = setting.value;
          }
        });
        
        setSettings(formattedSettings);
      } catch (err) {
        console.error('Error refreshing settings:', err);
      } finally {
        setLoading(false);
      }
    }
  };
}

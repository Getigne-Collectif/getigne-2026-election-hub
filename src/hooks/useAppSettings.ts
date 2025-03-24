
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AppSettings = {
  showProgram: boolean;
  [key: string]: any;
};

const defaultSettings: AppSettings = {
  showProgram: false,
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
              formattedSettings.showProgram = setting.value.enabled;
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

  return { settings, loading, error, updateSetting };
}

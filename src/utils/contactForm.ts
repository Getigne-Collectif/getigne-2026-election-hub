
import { supabase } from '@/integrations/supabase/client';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  source?: 'contact' | 'committee';
  committeeId?: string;
  committeeTitle?: string;
  url?: string; // URL de la page où le formulaire a été soumis
}

export const submitContactForm = async (formData: ContactFormData) => {
  try {
    // Ajouter l'URL actuelle si elle n'est pas fournie
    const enhancedFormData = {
      ...formData,
      url: formData.url || window.location.href
    };

    const { data, error } = await supabase.functions.invoke('contact-form', {
      body: enhancedFormData
    });

    if (error) {
      console.error('Error submitting contact form:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to submit contact form:', error);
    throw error;
  }
};

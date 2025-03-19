
import { supabase } from '@/integrations/supabase/client';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  source?: 'contact' | 'committee';
  committeeId?: string;
  committeeTitle?: string;
}

export const submitContactForm = async (formData: ContactFormData) => {
  try {
    const { data, error } = await supabase.functions.invoke('contact-form', {
      body: formData
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

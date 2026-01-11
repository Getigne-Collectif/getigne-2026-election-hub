import type { OutputData } from '@editorjs/editorjs';
import type { Tables } from '@/integrations/supabase/types';

export type FAQItemStatus = 'draft' | 'pending' | 'validated';

// Types de base pour les tables FAQ
export interface FAQ {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface FAQCategory {
  id: string;
  faq_id: string;
  name: string;
  icon: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface FAQItem {
  id: string;
  faq_category_id: string;
  question: string;
  answer: OutputData | string;
  status: FAQItemStatus;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface FAQWithCategories extends FAQ {
  faq_categories: (FAQCategory & {
    faq_items: FAQItem[];
  })[];
}


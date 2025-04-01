
export interface Project {
  id: string;
  title: string;
  description: string;
  image?: string | null;
  contact_email?: string | null;
  contact_info?: string | null;
  status?: string;
  development_status?: 'active' | 'development';
  is_featured?: boolean;
  url?: string | null;
  created_at?: string;
  updated_at?: string;
  sort_order?: number;
}


export interface Project {
  id: string;
  title: string;
  description: string;
  image: string | null;
  contact_info: string | null;
  contact_email: string | null;
  status: string;
  is_featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  sort_order: number | null;
  url: string | null;
}

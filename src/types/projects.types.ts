
export interface Project {
  id: string;
  title: string;
  description: string;
  image?: string | null;
  contact_email?: string | null;
  contact_info?: string | null;
  status?: string;
  development_status: string; // Changed from union type to string to match database return type
  is_featured?: boolean;
  url?: string | null;
  created_at?: string;
  updated_at?: string;
  sort_order?: number;
}

export interface ProjectWithLikes extends Project {
  likes_count: number;
}

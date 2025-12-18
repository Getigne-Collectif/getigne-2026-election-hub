
export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'deleted';

export interface Profile {
  first_name: string;
  last_name: string;
  avatar_url?: string;
  id: string;
}

// Base comment interface with common properties
export interface BaseComment {
  id: string;
  user_id: string | null; // Peut être null si l'utilisateur a supprimé son compte
  content: string;
  created_at: string;
  updated_at?: string;
  edited_at?: string;
  status: CommentStatus;
  profiles?: Profile | null;
  parent_comment_id?: string | null;
  likes_count?: number;
  is_liked?: boolean;
  is_viewed?: boolean; // Indique si l'utilisateur actuel a vu ce commentaire
  replies?: Comment[];
}

// Interface pour les vues de commentaires
export interface CommentView {
  id: string;
  comment_id: string;
  user_id: string;
  comment_type: ResourceType;
  created_at: string;
}

// Type for news comments
export interface NewsComment extends BaseComment {
  news_id: string;
  program_item_id?: never;
  program_point_id?: never;
}

// Type for program comments
export interface ProgramComment extends BaseComment {
  program_item_id?: string | null;
  program_point_id?: string | null;
  flagship_project_id?: string | null;
  news_id?: never;
}

// Union type for all comment types
export type Comment = NewsComment | ProgramComment;

// Resource type used for determining which table to query
export type ResourceType = 'news' | 'program';

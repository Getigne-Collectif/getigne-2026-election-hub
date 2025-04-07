
export type CommentStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

// Base comment interface with common properties
export interface BaseComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  status: CommentStatus;
  profiles?: Profile | null;
}

// Type for news comments
export interface NewsComment extends BaseComment {
  news_id: string;
  program_item_id?: never;
  program_point_id?: never;
}

// Type for program comments
export interface ProgramComment extends BaseComment {
  program_item_id: string;
  program_point_id?: string | null;
  news_id?: never;
}

// Union type for all comment types
export type Comment = NewsComment | ProgramComment;

export type ResourceType = 'news' | 'program' | 'program_point';

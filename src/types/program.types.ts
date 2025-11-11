
export type ProgramPointStatus = 'draft' | 'pending' | 'validated';

export interface ProgramPointFileMeta {
  url: string;
  label: string;
  path?: string | null;
}

export interface ProgramPoint {
  id: string;
  title: string;
  content: string;
  position: number;
  program_item_id: string;
  status: ProgramPointStatus;
  competent_entity_id?: string | null;
  competent_entity?: ProgramCompetentEntity | null;
  files?: string[] | null;
  files_metadata?: ProgramPointFileMeta[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProgramItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  image?: string;
  content?: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramCompetentEntity {
  id: string;
  name: string;
  logo_url?: string | null;
  logo_path?: string | null;
  created_at?: string;
  updated_at?: string;
}

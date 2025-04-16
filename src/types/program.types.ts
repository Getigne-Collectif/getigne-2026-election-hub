
export interface ProgramPoint {
  id: string;
  title: string;
  content: string;
  position: number;
  program_item_id: string;
  files?: string[] | null;
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
  created_at: string;
  updated_at: string;
}

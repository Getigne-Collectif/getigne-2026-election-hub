
export interface ProgramPoint {
  id: string;
  title: string;
  content: string;
  position: number;
  program_item_id: string;
  files?: string[] | null;
}

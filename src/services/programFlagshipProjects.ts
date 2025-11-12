import type { OutputData } from '@editorjs/editorjs';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type { ProgramFlagshipProject } from '@/types/program.types';

type FlagshipRow = Tables<'program_flagship_projects'>;
type FlagshipInsert = TablesInsert<'program_flagship_projects'>;
type FlagshipUpdate = TablesUpdate<'program_flagship_projects'>;

const TABLE_NAME = 'program_flagship_projects';

const mapRowToProject = (row: FlagshipRow): ProgramFlagshipProject => ({
  id: row.id,
  title: row.title,
  description: row.description,
  image_url: row.image_url,
  image_path: row.image_path,
  position: row.position ?? 0,
  effects: (row.effects as any) ?? [],
  timeline: (row.timeline as any) ?? [],
  timeline_horizon: row.timeline_horizon ?? null,
  file_url: row.file_url,
  file_path: row.file_path,
  file_label: row.file_label,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const fetchFlagshipProjects = async (): Promise<ProgramFlagshipProject[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapRowToProject);
};

export interface SaveFlagshipProjectPayload {
  title: string;
  description: OutputData | string;
  imageUrl?: string | null;
  imagePath?: string | null;
  position?: number;
  effects?: any[];
  timeline?: any[];
  timelineHorizon?: string | null;
  fileUrl?: string | null;
  filePath?: string | null;
  fileLabel?: string | null;
}

const buildUpsertPayload = (
  payload: SaveFlagshipProjectPayload,
): FlagshipInsert | FlagshipUpdate => {
  const base: FlagshipUpdate = {
    title: payload.title,
    description:
      typeof payload.description === 'string'
        ? (payload.description as unknown as FlagshipRow['description'])
        : (payload.description as unknown as FlagshipRow['description']),
    image_url: payload.imageUrl ?? null,
    image_path: payload.imagePath ?? null,
    effects: (payload.effects ?? []) as any,
    timeline: (payload.timeline ?? []) as any,
    timeline_horizon: payload.timelineHorizon ?? null,
    file_url: payload.fileUrl ?? null,
    file_path: payload.filePath ?? null,
    file_label: payload.fileLabel ?? null,
    updated_at: new Date().toISOString(),
  };

  if (typeof payload.position === 'number') {
    base.position = payload.position;
  }

  return base;
};

export const createFlagshipProject = async (
  payload: SaveFlagshipProjectPayload,
): Promise<ProgramFlagshipProject> => {
  const insertPayload: FlagshipInsert = {
    ...buildUpsertPayload(payload),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapRowToProject(data as FlagshipRow);
};

export const updateFlagshipProject = async (
  id: string,
  payload: SaveFlagshipProjectPayload,
): Promise<ProgramFlagshipProject> => {
  const updatePayload: FlagshipUpdate = buildUpsertPayload(payload);

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapRowToProject(data as FlagshipRow);
};

export const deleteFlagshipProject = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

  if (error) {
    throw error;
  }
};

export const updateFlagshipPositions = async (
  orderedIds: string[],
): Promise<void> => {
  const updates = orderedIds.map((id, index) =>
    supabase.from(TABLE_NAME).update({ position: index }).eq('id', id),
  );

  const results = await Promise.all(updates);
  const hasError = results.find(({ error }) => error);

  if (hasError?.error) {
    throw hasError.error;
  }
};


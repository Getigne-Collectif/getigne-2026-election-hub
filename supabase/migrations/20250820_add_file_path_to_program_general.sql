-- Add file_path column to store storage object path for reliable downloads
alter table if exists public.program_general
  add column if not exists file_path text;

comment on column public.program_general.file_path is 'Storage object path in bucket program_files for the program PDF';


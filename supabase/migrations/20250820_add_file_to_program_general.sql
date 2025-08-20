-- Create public storage bucket for program PDFs (idempotent)
do $$ begin
  perform 1 from storage.buckets where id = 'program_files';
  if not found then
    perform storage.create_bucket('program_files', public => true);
  end if;
end $$;

-- Add file column to program_general
alter table if exists public.program_general
  add column if not exists file text;

comment on column public.program_general.file is 'Public URL of the downloadable program PDF';


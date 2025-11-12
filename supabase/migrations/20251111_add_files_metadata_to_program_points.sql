alter table public.program_points
add column if not exists files_metadata jsonb;

update public.program_points
set files_metadata = (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'url', file_url,
        'label', coalesce(split_part(file_url, '/', array_length(string_to_array(file_url, '/'), 1)), 'Fichier'),
        'path', regexp_replace(file_url, '^.*?/program_files/', '')
      )
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements_text(coalesce(files::jsonb, '[]'::jsonb)) as file_url
)
where files is not null and (files_metadata is null or jsonb_array_length(files_metadata) = 0);

alter table public.program_points
alter column files_metadata set default '[]'::jsonb;

update public.program_points
set files_metadata = '[]'::jsonb
where files_metadata is null;

alter table public.program_points
alter column files_metadata set not null;



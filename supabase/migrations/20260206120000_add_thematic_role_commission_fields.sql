alter table public.thematic_roles
  add column if not exists acronym text,
  add column if not exists is_commission boolean not null default false,
  add column if not exists parent_role_id uuid;

alter table public.thematic_roles
  add constraint thematic_roles_parent_role_id_fkey
  foreign key (parent_role_id)
  references public.thematic_roles (id)
  on delete set null;

create index if not exists thematic_roles_parent_role_id_idx
  on public.thematic_roles (parent_role_id);

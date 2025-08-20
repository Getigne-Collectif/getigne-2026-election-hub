-- Add foreground color column for custom SVG icons in galaxy_items
alter table if exists public.galaxy_items
  add column if not exists icon_fg text null;



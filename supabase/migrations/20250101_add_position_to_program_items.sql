-- Ajout de la colonne position à la table program_items
ALTER TABLE public.program_items ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Mise à jour des positions existantes basées sur l'ordre de création
UPDATE public.program_items 
SET position = subquery.new_position 
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 as new_position
  FROM public.program_items
) AS subquery
WHERE public.program_items.id = subquery.id;

-- Ajout d'un index sur la colonne position pour optimiser le tri
CREATE INDEX IF NOT EXISTS idx_program_items_position ON public.program_items(position);

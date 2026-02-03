-- Ajout d'un numéro unique et non modifiable pour chaque program_point.
-- Le numéro est attribué à l'insertion et ne peut pas être modifié ensuite.

-- 1. Créer la séquence pour les nouveaux points
CREATE SEQUENCE IF NOT EXISTS public.program_points_number_seq;

-- 2. Ajouter la colonne number (nullable temporairement pour le backfill)
ALTER TABLE public.program_points
  ADD COLUMN IF NOT EXISTS number integer;

-- 3. Remplir les numéros pour les lignes existantes (ordre: program_item_id, position)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY program_item_id, position, created_at) AS rn
  FROM public.program_points
  WHERE number IS NULL
)
UPDATE public.program_points pp
SET number = ordered.rn
FROM ordered
WHERE pp.id = ordered.id;

-- 4. Mettre à jour la séquence au-delà du max existant
SELECT setval(
  'public.program_points_number_seq',
  COALESCE((SELECT max(number) FROM public.program_points), 0)
);

-- 5. Rendre la colonne NOT NULL et définir la valeur par défaut pour les insertions
ALTER TABLE public.program_points
  ALTER COLUMN number SET DEFAULT nextval('public.program_points_number_seq'),
  ALTER COLUMN number SET NOT NULL;

-- 6. Trigger : empêcher toute modification du numéro (lecture seule après création)
CREATE OR REPLACE FUNCTION public.program_points_keep_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- À chaque UPDATE, conserver l'ancienne valeur de number
  NEW.number := OLD.number;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS program_points_keep_number_trigger ON public.program_points;
CREATE TRIGGER program_points_keep_number_trigger
  BEFORE UPDATE ON public.program_points
  FOR EACH ROW
  EXECUTE FUNCTION public.program_points_keep_number();

-- 7. Index optionnel pour les recherches par numéro
CREATE INDEX IF NOT EXISTS idx_program_points_number ON public.program_points(number);

COMMENT ON COLUMN public.program_points.number IS 'Numéro unique attribué à la création, non modifiable.';

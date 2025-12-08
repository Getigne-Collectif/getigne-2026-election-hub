-- Ajout du statut 'to_discuss' (À discuter) à la table program_points
-- Modification de la contrainte CHECK pour inclure le nouveau statut
ALTER TABLE public.program_points 
  DROP CONSTRAINT IF EXISTS program_points_status_check;

ALTER TABLE public.program_points 
  ADD CONSTRAINT program_points_status_check 
  CHECK (status IN ('draft', 'pending', 'to_discuss', 'validated'));


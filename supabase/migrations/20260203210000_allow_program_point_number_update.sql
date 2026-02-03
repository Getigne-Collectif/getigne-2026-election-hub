-- Autoriser la mise à jour du numéro en mode édition (admin).
-- Suppression du trigger qui forçait le numéro en lecture seule.

DROP TRIGGER IF EXISTS program_points_keep_number_trigger ON public.program_points;
DROP FUNCTION IF EXISTS public.program_points_keep_number();

-- Ajout de la colonne status à la table program_points
ALTER TABLE public.program_points ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'validated'));

-- Mise à jour des statuts existants (tous les points existants deviennent 'validated' par défaut)
UPDATE public.program_points SET status = 'validated' WHERE status IS NULL OR status = 'draft';

-- Ajout d'un index sur la colonne status pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_program_points_status ON public.program_points(status);

-- Ajout d'un index composite pour optimiser les requêtes par section et statut
CREATE INDEX IF NOT EXISTS idx_program_points_item_status ON public.program_points(program_item_id, status);

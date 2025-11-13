-- Migration: Ajouter la colonne content_editorjs à program_points
-- Cette colonne permettra de stocker le contenu au format EditorJS
-- tout en conservant la colonne content (Markdown) existante pendant la phase de transition

-- Ajouter la nouvelle colonne
ALTER TABLE public.program_points 
ADD COLUMN IF NOT EXISTS content_editorjs JSONB;

-- Créer un index pour optimiser les requêtes sur cette colonne
CREATE INDEX IF NOT EXISTS idx_program_points_content_editorjs 
ON public.program_points USING gin (content_editorjs);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.program_points.content_editorjs IS 
'Contenu au format EditorJS (JSON). Remplacera progressivement la colonne content (Markdown).';


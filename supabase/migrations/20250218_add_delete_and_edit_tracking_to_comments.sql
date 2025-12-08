-- Migration: Ajouter le statut deleted et le suivi des modifications
-- Description: Permet de supprimer des commentaires (soft delete) et de tracker les modifications

-- 1. Ajouter le statut 'deleted' à l'enum si nécessaire
-- Note: Si status est un enum, on doit d'abord vérifier et l'ajouter
-- Sinon, si c'est un VARCHAR, on peut directement utiliser 'deleted'

-- Pour les commentaires de news
-- Vérifier si la colonne status est un enum ou VARCHAR
-- Si c'est un enum, on doit faire: ALTER TYPE comment_status ADD VALUE 'deleted';
-- Pour l'instant, on suppose que c'est VARCHAR

-- 2. Ajouter une colonne edited_at pour tracker les modifications
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

ALTER TABLE program_comments
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- 3. Créer un index sur edited_at pour les requêtes
CREATE INDEX IF NOT EXISTS idx_comments_edited_at ON comments(edited_at) WHERE edited_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_program_comments_edited_at ON program_comments(edited_at) WHERE edited_at IS NOT NULL;

-- 4. Commentaires pour la documentation
COMMENT ON COLUMN comments.edited_at IS 'Date et heure de la dernière modification du commentaire';
COMMENT ON COLUMN program_comments.edited_at IS 'Date et heure de la dernière modification du commentaire';

-- Note: Le statut 'deleted' peut être utilisé directement si status est VARCHAR
-- Sinon, il faudra modifier l'enum avec: ALTER TYPE comment_status ADD VALUE 'deleted';


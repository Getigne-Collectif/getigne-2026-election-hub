-- Migration: Créer la table comment_views pour le suivi de lecture des commentaires
-- Description: Permet de suivre quels commentaires ont été vus par quels utilisateurs

-- Créer la table comment_views
CREATE TABLE IF NOT EXISTS comment_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_type VARCHAR(10) NOT NULL CHECK (comment_type IN ('news', 'program')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id, comment_type)
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_comment_views_comment_id ON comment_views(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_views_user_id ON comment_views(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_views_comment_type ON comment_views(comment_type);
CREATE INDEX IF NOT EXISTS idx_comment_views_user_comment_type ON comment_views(user_id, comment_type);

-- Activer RLS (Row Level Security)
ALTER TABLE comment_views ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour comment_views
-- Les utilisateurs peuvent voir leurs propres vues
CREATE POLICY "Users can view their own comment views"
  ON comment_views FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs authentifiés peuvent créer leurs propres vues
CREATE POLICY "Authenticated users can create their own comment views"
  ON comment_views FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres vues (pour réinitialiser si nécessaire)
CREATE POLICY "Users can delete their own comment views"
  ON comment_views FOR DELETE
  USING (auth.uid() = user_id);

-- Commentaires pour la documentation
COMMENT ON TABLE comment_views IS 'Table de suivi des commentaires vus par les utilisateurs';
COMMENT ON COLUMN comment_views.comment_id IS 'ID du commentaire (peut être de la table comments ou program_comments)';
COMMENT ON COLUMN comment_views.comment_type IS 'Type de commentaire: news ou program';
COMMENT ON COLUMN comment_views.user_id IS 'ID de l''utilisateur qui a vu le commentaire';


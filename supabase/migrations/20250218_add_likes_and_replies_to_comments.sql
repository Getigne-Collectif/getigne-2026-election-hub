-- Migration: Ajouter les fonctionnalités de likes et de réponses aux commentaires
-- Description: Ajoute la possibilité de liker un commentaire et de répondre à un commentaire

-- 1. Ajouter parent_comment_id à la table comments (pour les réponses)
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- 2. Ajouter parent_comment_id à la table program_comments (pour les réponses)
ALTER TABLE program_comments
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES program_comments(id) ON DELETE CASCADE;

-- 3. Créer la table comment_likes pour les likes sur les commentaires de news
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 4. Créer la table program_comment_likes pour les likes sur les commentaires de programme
CREATE TABLE IF NOT EXISTS program_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES program_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 5. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_program_comment_likes_comment_id ON program_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_program_comment_likes_user_id ON program_comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_program_comments_parent_comment_id ON program_comments(parent_comment_id);

-- 6. Activer RLS (Row Level Security)
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_comment_likes ENABLE ROW LEVEL SECURITY;

-- 7. Politiques RLS pour comment_likes
-- Les utilisateurs peuvent voir tous les likes
CREATE POLICY "Anyone can view comment likes"
  ON comment_likes FOR SELECT
  USING (true);

-- Les utilisateurs authentifiés peuvent liker
CREATE POLICY "Authenticated users can like comments"
  ON comment_likes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Les utilisateurs peuvent retirer leur propre like
CREATE POLICY "Users can unlike their own likes"
  ON comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Politiques RLS pour program_comment_likes
-- Les utilisateurs peuvent voir tous les likes
CREATE POLICY "Anyone can view program comment likes"
  ON program_comment_likes FOR SELECT
  USING (true);

-- Les utilisateurs authentifiés peuvent liker
CREATE POLICY "Authenticated users can like program comments"
  ON program_comment_likes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Les utilisateurs peuvent retirer leur propre like
CREATE POLICY "Users can unlike their own program comment likes"
  ON program_comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 9. Commentaires pour la documentation
COMMENT ON COLUMN comments.parent_comment_id IS 'Référence vers le commentaire parent si ce commentaire est une réponse';
COMMENT ON COLUMN program_comments.parent_comment_id IS 'Référence vers le commentaire parent si ce commentaire est une réponse';
COMMENT ON TABLE comment_likes IS 'Table des likes sur les commentaires d''articles';
COMMENT ON TABLE program_comment_likes IS 'Table des likes sur les commentaires de programme';


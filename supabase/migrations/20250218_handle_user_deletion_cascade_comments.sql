-- Migration: Gérer la suppression en cascade des commentaires lors de la suppression d'un utilisateur
-- Description: Quand un utilisateur supprime son compte, supprimer ses commentaires en respectant les règles :
-- - Si le commentaire n'a pas de réponses : suppression définitive
-- - Si le commentaire a des réponses : marquer comme deleted et mettre user_id à NULL

-- 1. Modifier les contraintes de clé étrangère pour permettre SET NULL
-- Pour comments
ALTER TABLE comments
DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

ALTER TABLE comments
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Pour program_comments
ALTER TABLE program_comments
DROP CONSTRAINT IF EXISTS program_comments_user_id_fkey;

ALTER TABLE program_comments
ADD CONSTRAINT program_comments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- 2. Créer une fonction pour gérer la suppression en cascade avec les règles
-- Note: La contrainte SET NULL mettra automatiquement user_id à NULL
-- Cette fonction gère la logique de suppression (hard delete vs soft delete)
CREATE OR REPLACE FUNCTION handle_user_comment_deletion()
RETURNS TRIGGER AS $$
DECLARE
  comment_record RECORD;
  has_replies BOOLEAN;
BEGIN
  -- Traiter les commentaires de news
  FOR comment_record IN 
    SELECT id 
    FROM comments 
    WHERE user_id = OLD.id
  LOOP
    -- Vérifier si le commentaire a des réponses
    SELECT EXISTS(SELECT 1 FROM comments WHERE parent_comment_id = comment_record.id) INTO has_replies;
    
    IF has_replies THEN
      -- Si oui, marquer comme deleted (user_id sera mis à NULL par SET NULL)
      UPDATE comments 
      SET status = 'deleted'
      WHERE id = comment_record.id;
    ELSE
      -- Si non, supprimer définitivement
      DELETE FROM comments WHERE id = comment_record.id;
    END IF;
  END LOOP;

  -- Traiter les commentaires de programme
  FOR comment_record IN 
    SELECT id 
    FROM program_comments 
    WHERE user_id = OLD.id
  LOOP
    -- Vérifier si le commentaire a des réponses
    SELECT EXISTS(SELECT 1 FROM program_comments WHERE parent_comment_id = comment_record.id) INTO has_replies;
    
    IF has_replies THEN
      -- Si oui, marquer comme deleted (user_id sera mis à NULL par SET NULL)
      UPDATE program_comments 
      SET status = 'deleted'
      WHERE id = comment_record.id;
    ELSE
      -- Si non, supprimer définitivement
      DELETE FROM program_comments WHERE id = comment_record.id;
    END IF;
  END LOOP;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 3. Créer le trigger qui s'exécute avant la suppression de l'utilisateur
DROP TRIGGER IF EXISTS trigger_handle_user_comment_deletion ON auth.users;

CREATE TRIGGER trigger_handle_user_comment_deletion
BEFORE DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_user_comment_deletion();

-- 4. Commentaires pour la documentation
COMMENT ON FUNCTION handle_user_comment_deletion() IS 'Fonction qui gère la suppression en cascade des commentaires lors de la suppression d''un utilisateur. Supprime définitivement les commentaires sans réponses, et marque comme deleted ceux avec des réponses.';


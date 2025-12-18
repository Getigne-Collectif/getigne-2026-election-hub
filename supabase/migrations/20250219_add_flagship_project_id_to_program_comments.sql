-- Ajouter le champ flagship_project_id à la table program_comments
-- pour permettre les commentaires sur les projets phares

-- Rendre program_item_id nullable pour permettre les commentaires sur les projets phares
ALTER TABLE program_comments
ALTER COLUMN program_item_id DROP NOT NULL;

-- Ajouter le champ flagship_project_id
ALTER TABLE program_comments
ADD COLUMN IF NOT EXISTS flagship_project_id UUID REFERENCES program_flagship_projects(id) ON DELETE CASCADE;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_program_comments_flagship_project_id 
ON program_comments(flagship_project_id) 
WHERE flagship_project_id IS NOT NULL;

-- Ajouter une contrainte de vérification pour s'assurer qu'au moins un des champs est défini
ALTER TABLE program_comments
ADD CONSTRAINT check_program_comment_reference 
CHECK (
  (program_item_id IS NOT NULL) OR 
  (flagship_project_id IS NOT NULL)
);

-- Commentaire pour documenter le champ
COMMENT ON COLUMN program_comments.flagship_project_id IS 'Référence vers le projet phare si ce commentaire est associé à un projet phare';


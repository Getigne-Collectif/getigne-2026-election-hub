-- Migration: Ajouter le genre aux membres de l'équipe
-- Description: Ajoute la colonne gender pour permettre la gestion de la parité sur la liste électorale

ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('homme', 'femme', 'autre'));

COMMENT ON COLUMN team_members.gender IS 'Genre du membre : homme, femme ou autre. Utilisé pour la règle de parité sur la liste électorale';






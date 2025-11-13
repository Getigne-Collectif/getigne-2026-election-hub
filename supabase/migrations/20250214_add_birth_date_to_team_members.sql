-- Migration: Ajouter la date de naissance aux membres de l'équipe
-- Description: Ajoute la colonne birth_date pour permettre la validation d'âge (18+) sur la liste électorale

ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMENT ON COLUMN team_members.birth_date IS 'Date de naissance du membre. Utilisé pour valider l''âge minimum (18 ans) pour être sur la liste électorale';



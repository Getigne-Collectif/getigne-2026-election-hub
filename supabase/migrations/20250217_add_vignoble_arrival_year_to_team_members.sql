-- Migration: Ajouter l'année d'arrivée dans le vignoble aux membres de l'équipe
-- Description: Ajoute la colonne vignoble_arrival_year pour permettre l'analyse de l'ancrage territorial

ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS vignoble_arrival_year INTEGER CHECK (vignoble_arrival_year >= 1900 AND vignoble_arrival_year <= EXTRACT(YEAR FROM CURRENT_DATE));

COMMENT ON COLUMN team_members.vignoble_arrival_year IS 'Année d''arrivée dans le vignoble nantais. Utilisé pour analyser l''ancrage territorial des membres de la liste électorale';












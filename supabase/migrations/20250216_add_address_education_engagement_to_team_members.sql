-- Migration: Ajouter adresse, géolocalisation, niveau d'étude et niveau d'engagement aux membres
-- Description: Ajoute les colonnes pour l'adresse postale avec géocodification automatique,
-- le niveau d'étude et le niveau d'engagement maximum envisagé sur la liste électorale

-- 1. Créer l'enum pour le niveau d'étude
CREATE TYPE education_level AS ENUM (
  'brevet',
  'cap_bep',
  'bac_general',
  'bac_technologique',
  'bac_professionnel',
  'bac_plus_1_2',
  'bac_plus_3',
  'bac_plus_4_5',
  'bac_plus_6_plus'
);

-- 2. Créer l'enum pour le niveau d'engagement maximum
CREATE TYPE max_engagement_level AS ENUM (
  'positions_1_8',
  'positions_9_21',
  'positions_22_29'
);

-- 3. Ajouter les colonnes à team_members
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS education_level education_level,
ADD COLUMN IF NOT EXISTS max_engagement_level max_engagement_level;

-- 4. Ajouter des commentaires pour la documentation
COMMENT ON COLUMN team_members.address IS 'Adresse postale complète du membre';
COMMENT ON COLUMN team_members.latitude IS 'Latitude calculée automatiquement depuis l''adresse via Google Maps API';
COMMENT ON COLUMN team_members.longitude IS 'Longitude calculée automatiquement depuis l''adresse via Google Maps API';
COMMENT ON COLUMN team_members.education_level IS 'Niveau d''étude du membre (peut être null)';
COMMENT ON COLUMN team_members.max_engagement_level IS 'Niveau d''engagement maximum envisagé sur la liste électorale (peut être null). Si la position sur la liste est supérieure, la carte sera surlignée en rouge. Si inférieure ou égale, en bleu.';



-- Migration: Rendre l'image optionnelle et configurer le stockage
-- Description: Permet aux membres de l'équipe de ne pas avoir d'image et configure le bucket pour stocker les images

-- 1. Rendre la colonne image nullable
ALTER TABLE team_members
ALTER COLUMN image DROP NOT NULL;

-- 2. Créer le bucket pour les images des membres de l'équipe
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-members', 'team-members', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Configurer les policies pour le bucket team-members

-- Policy: Tout le monde peut voir les images (lecture publique)
CREATE POLICY "Public can view team member images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'team-members');

-- Policy: Les utilisateurs authentifiés peuvent uploader des images
CREATE POLICY "Authenticated users can upload team member images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'team-members');

-- Policy: Les utilisateurs authentifiés peuvent mettre à jour leurs uploads
CREATE POLICY "Authenticated users can update team member images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'team-members')
WITH CHECK (bucket_id = 'team-members');

-- Policy: Les utilisateurs authentifiés peuvent supprimer des images
CREATE POLICY "Authenticated users can delete team member images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'team-members');



-- Migration: Rendre bio et role optionnels pour team_members
-- Description: Permet de créer des membres sans bio ni rôle définis et ajoute les policies RLS pour CRUD

-- 1. Rendre bio et role optionnels
ALTER TABLE team_members
ALTER COLUMN bio DROP NOT NULL;

ALTER TABLE team_members
ALTER COLUMN role DROP NOT NULL;

-- 2. Ajouter les policies RLS pour permettre aux utilisateurs authentifiés de gérer les team_members

-- Policy INSERT pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can insert team_members"
ON team_members FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy UPDATE pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can update team_members"
ON team_members FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy DELETE pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete team_members"
ON team_members FOR DELETE
TO authenticated
USING (true);



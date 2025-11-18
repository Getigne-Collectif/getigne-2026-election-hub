-- Migration: Supprimer la colonne email de la table profiles
-- Description: L'email est stocké dans auth.users et ne doit pas être dupliqué dans profiles

-- Supprimer la colonne email si elle existe
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS email;


-- Migration finale: Nettoyage après validation
-- ⚠️ ATTENTION: N'exécutez cette migration qu'après avoir validé que tout fonctionne correctement
-- ⚠️ Cette migration est IRRÉVERSIBLE - faites une sauvegarde complète avant de l'exécuter

-- Cette migration:
-- 1. Supprime l'ancienne colonne 'content' (Markdown)
-- 2. Renomme 'content_editorjs' en 'content'
-- 3. Nettoie les fonctions auxiliaires de conversion

-- PRÉREQUIS AVANT EXÉCUTION:
-- [ ] Tous les tests ont été effectués avec succès
-- [ ] Le site fonctionne correctement avec content_editorjs
-- [ ] Une sauvegarde complète de la base de données a été effectuée
-- [ ] Le site a tourné en production pendant au moins 1-2 jours sans problème

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION FINALE DE NETTOYAGE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Cette migration va:';
  RAISE NOTICE '1. Supprimer la colonne content (Markdown)';
  RAISE NOTICE '2. Renommer content_editorjs en content';
  RAISE NOTICE '3. Nettoyer les fonctions auxiliaires';
  RAISE NOTICE '';
  RAISE NOTICE 'Cette opération est IRRÉVERSIBLE';
  RAISE NOTICE '';
END $$;

-- Vérification: S'assurer que tous les points ont un content_editorjs
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM program_points
  WHERE content_editorjs IS NULL;
  
  IF missing_count > 0 THEN
    RAISE EXCEPTION 'ERREUR: % points n''ont pas de content_editorjs. Migration annulée.', missing_count;
  END IF;
  
  RAISE NOTICE 'Vérification OK: Tous les points ont un content_editorjs';
END $$;

-- Étape 1: Supprimer l'ancienne colonne content
ALTER TABLE public.program_points 
DROP COLUMN IF EXISTS content;

RAISE NOTICE 'Colonne content (Markdown) supprimée';

-- Étape 2: Renommer content_editorjs en content
ALTER TABLE public.program_points 
RENAME COLUMN content_editorjs TO content;

RAISE NOTICE 'Colonne content_editorjs renommée en content';

-- Étape 3: Recréer l'index avec le nouveau nom
DROP INDEX IF EXISTS idx_program_points_content_editorjs;

CREATE INDEX IF NOT EXISTS idx_program_points_content 
ON public.program_points USING gin (content);

RAISE NOTICE 'Index recréé sur la colonne content';

-- Étape 4: Mettre à jour le commentaire de la colonne
COMMENT ON COLUMN public.program_points.content IS 
'Contenu au format EditorJS (JSON). Remplace l''ancien format Markdown.';

-- Étape 5: Nettoyer les fonctions auxiliaires de conversion
DROP FUNCTION IF EXISTS escape_json_string(TEXT);
DROP FUNCTION IF EXISTS markdown_to_editorjs(TEXT);

RAISE NOTICE 'Fonctions auxiliaires de conversion supprimées';

-- Message de confirmation final
DO $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count 
  FROM public.program_points;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION TERMINÉE AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '% program points migrés vers EditorJS', total_count;
  RAISE NOTICE 'La colonne content contient maintenant le format EditorJS';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaines étapes:';
  RAISE NOTICE '1. Mettre à jour les types TypeScript pour refléter le nouveau schéma';
  RAISE NOTICE '2. Nettoyer le code frontend (supprimer les fallbacks Markdown)';
  RAISE NOTICE '3. Supprimer les imports ReactMarkdown et remarkGfm inutilisés';
  RAISE NOTICE '';
END $$;


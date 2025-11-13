-- Migration améliorée: Conversion Markdown vers EditorJS avec support du formatage
-- Cette migration remplace la version précédente avec un meilleur parsing

-- Fonction pour convertir le formatage Markdown inline en HTML pour EditorJS
CREATE OR REPLACE FUNCTION convert_markdown_inline_to_html(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  result := text_input;
  
  -- Convertir le gras (**texte** ou __texte__) en <b>texte</b>
  result := regexp_replace(result, '\*\*([^\*]+)\*\*', '<b>\1</b>', 'g');
  result := regexp_replace(result, '__([^_]+)__', '<b>\1</b>', 'g');
  
  -- Convertir l'italique (*texte* ou _texte_) en <i>texte</i>
  result := regexp_replace(result, '\*([^\*]+)\*', '<i>\1</i>', 'g');
  result := regexp_replace(result, '_([^_]+)_', '<i>\1</i>', 'g');
  
  -- Convertir le code inline (`code`) en <code>code</code>
  result := regexp_replace(result, '`([^`]+)`', '<code>\1</code>', 'g');
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction améliorée pour convertir Markdown en EditorJS
CREATE OR REPLACE FUNCTION markdown_to_editorjs_improved(markdown_text TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  blocks JSONB := '[]'::JSONB;
  lines TEXT[];
  line TEXT;
  cleaned_line TEXT;
  in_list BOOLEAN := false;
  list_items TEXT[] := '{}';
  list_style TEXT := 'unordered';
  i INTEGER;
BEGIN
  -- Si le texte est vide ou null, retourner une structure EditorJS vide
  IF markdown_text IS NULL OR trim(markdown_text) = '' THEN
    RETURN jsonb_build_object(
      'time', extract(epoch from now())::bigint * 1000,
      'blocks', '[]'::JSONB,
      'version', '2.28.0'
    );
  END IF;

  -- Séparer le texte en lignes
  lines := string_to_array(markdown_text, E'\n');

  FOR i IN 1..array_length(lines, 1) LOOP
    line := lines[i];
    cleaned_line := trim(line);
    
    -- Ignorer les lignes vides entre les items (mais créer des paragraphes pour les vraies lignes vides)
    IF cleaned_line = '' THEN
      -- Si on était dans une liste, on termine la liste
      IF in_list AND array_length(list_items, 1) > 0 THEN
        blocks := blocks || jsonb_build_object(
          'id', md5(random()::text || clock_timestamp()::text),
          'type', 'list',
          'data', jsonb_build_object(
            'style', list_style,
            'items', array_to_json(list_items)::jsonb
          )
        );
        list_items := '{}';
        in_list := false;
      END IF;
      CONTINUE;
    END IF;
    
    -- Détecter les listes à puces (-, *, +)
    IF cleaned_line ~ '^[\-\*\+]\s+' THEN
      IF NOT in_list THEN
        in_list := true;
        list_style := 'unordered';
      END IF;
      -- Extraire le texte après le marqueur de liste
      cleaned_line := trim(regexp_replace(cleaned_line, '^[\-\*\+]\s+', ''));
      cleaned_line := convert_markdown_inline_to_html(cleaned_line);
      list_items := array_append(list_items, cleaned_line);
      CONTINUE;
    END IF;
    
    -- Détecter les listes numérotées (1., 2., etc.)
    IF cleaned_line ~ '^\d+\.\s+' THEN
      IF NOT in_list THEN
        in_list := true;
        list_style := 'ordered';
      END IF;
      -- Extraire le texte après le numéro
      cleaned_line := trim(regexp_replace(cleaned_line, '^\d+\.\s+', ''));
      cleaned_line := convert_markdown_inline_to_html(cleaned_line);
      list_items := array_append(list_items, cleaned_line);
      CONTINUE;
    END IF;
    
    -- Si on arrive ici et qu'on était dans une liste, on termine la liste
    IF in_list AND array_length(list_items, 1) > 0 THEN
      blocks := blocks || jsonb_build_object(
        'id', md5(random()::text || clock_timestamp()::text),
        'type', 'list',
        'data', jsonb_build_object(
          'style', list_style,
          'items', array_to_json(list_items)::jsonb
        )
      );
      list_items := '{}';
      in_list := false;
    END IF;
    
    -- Détecter les titres (# Titre)
    IF cleaned_line ~ '^#{1,6}\s+' THEN
      -- Compter le nombre de #
      DECLARE
        header_level INTEGER;
        header_text TEXT;
      BEGIN
        header_level := length(regexp_replace(cleaned_line, '^(#{1,6}).*', '\1'));
        header_text := trim(regexp_replace(cleaned_line, '^#{1,6}\s+', ''));
        header_text := convert_markdown_inline_to_html(header_text);
        
        blocks := blocks || jsonb_build_object(
          'id', md5(random()::text || clock_timestamp()::text),
          'type', 'header',
          'data', jsonb_build_object(
            'text', header_text,
            'level', header_level
          )
        );
      END;
      CONTINUE;
    END IF;
    
    -- Sinon, c'est un paragraphe normal
    cleaned_line := convert_markdown_inline_to_html(cleaned_line);
    blocks := blocks || jsonb_build_object(
      'id', md5(random()::text || clock_timestamp()::text),
      'type', 'paragraph',
      'data', jsonb_build_object(
        'text', cleaned_line
      )
    );
  END LOOP;
  
  -- Si on termine avec une liste en cours
  IF in_list AND array_length(list_items, 1) > 0 THEN
    blocks := blocks || jsonb_build_object(
      'id', md5(random()::text || clock_timestamp()::text),
      'type', 'list',
      'data', jsonb_build_object(
        'style', list_style,
        'items', array_to_json(list_items)::jsonb
      )
    );
  END IF;

  -- Construire la structure EditorJS finale
  result := jsonb_build_object(
    'time', extract(epoch from now())::bigint * 1000,
    'blocks', blocks,
    'version', '2.28.0'
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Appliquer la conversion améliorée à tous les program points
UPDATE public.program_points
SET content_editorjs = markdown_to_editorjs_improved(content)
WHERE content IS NOT NULL;

-- Message de confirmation
DO $$
DECLARE
  converted_count INTEGER;
  sample_record RECORD;
BEGIN
  SELECT COUNT(*) INTO converted_count 
  FROM public.program_points 
  WHERE content_editorjs IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration améliorée terminée';
  RAISE NOTICE '========================================';
  RAISE NOTICE '% program points convertis avec formatage amélioré', converted_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Améliorations:';
  RAISE NOTICE '- Support du gras (**texte**)';
  RAISE NOTICE '- Support de l''italique (*texte*)';
  RAISE NOTICE '- Support du code inline (`code`)';
  RAISE NOTICE '- Détection des listes à puces (-, *, +)';
  RAISE NOTICE '- Détection des listes numérotées (1., 2., etc.)';
  RAISE NOTICE '- Détection des titres (# Titre)';
  RAISE NOTICE '';
  
  -- Afficher un exemple de conversion
  SELECT title, content, content_editorjs::text 
  INTO sample_record
  FROM public.program_points 
  WHERE content IS NOT NULL 
    AND length(content) > 20
  LIMIT 1;
  
  IF FOUND THEN
    RAISE NOTICE 'Exemple de conversion:';
    RAISE NOTICE 'Titre: %', sample_record.title;
    RAISE NOTICE 'Contenu original (50 premiers car.): %', left(sample_record.content, 50);
    RAISE NOTICE '';
  END IF;
END $$;


-- Migration: Conversion des contenus markdown vers EditorJS pour la table events
-- Cette migration convertit tous les contenus markdown existants en format EditorJS JSON

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
  header_level INTEGER;
  header_text TEXT;
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
    
    -- Ignorer les lignes vides entre les items
    IF cleaned_line = '' THEN
      -- Si on était dans une liste, on termine la liste
      IF in_list AND array_length(list_items, 1) > 0 THEN
        blocks := blocks || jsonb_build_object(
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
      header_level := length(regexp_replace(cleaned_line, '^(#{1,6}).*', '\1'));
      header_text := trim(regexp_replace(cleaned_line, '^#{1,6}\s+', ''));
      header_text := convert_markdown_inline_to_html(header_text);
      
      blocks := blocks || jsonb_build_object(
        'type', 'header',
        'data', jsonb_build_object(
          'text', header_text,
          'level', header_level
        )
      );
      CONTINUE;
    END IF;
    
    -- Sinon, c'est un paragraphe normal
    cleaned_line := convert_markdown_inline_to_html(cleaned_line);
    blocks := blocks || jsonb_build_object(
      'type', 'paragraph',
      'data', jsonb_build_object(
        'text', cleaned_line
      )
    );
  END LOOP;
  
  -- Si on termine avec une liste en cours
  IF in_list AND array_length(list_items, 1) > 0 THEN
    blocks := blocks || jsonb_build_object(
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

-- Fonction pour détecter si un contenu est du markdown (simple détection)
CREATE OR REPLACE FUNCTION is_markdown_content(content_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Si le contenu est null ou vide, ce n'est pas du markdown
  IF content_text IS NULL OR trim(content_text) = '' THEN
    RETURN false;
  END IF;
  
  -- Si c'est déjà du JSON valide qui ressemble à EditorJS, ce n'est pas du markdown
  BEGIN
    IF content_text::jsonb ? 'blocks' THEN
      RETURN false;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Ce n'est pas du JSON valide, continuez
      NULL;
  END;
  
  -- Vérifier des motifs markdown communs
  IF content_text ~ '^#{1,6}\s+' THEN  -- Titres
    RETURN true;
  END IF;
  
  IF content_text ~ '^\*\s+' OR content_text ~ '^-\s+' OR content_text ~ '^\+\s+' THEN  -- Listes à puces
    RETURN true;
  END IF;
  
  IF content_text ~ '^\d+\.\s+' THEN  -- Listes numérotées
    RETURN true;
  END IF;
  
  IF content_text ~ '\*\*[^*]+\*\*' THEN  -- Gras
    RETURN true;
  END IF;
  
  IF content_text ~ '`[^`]+`' THEN  -- Code inline
    RETURN true;
  END IF;
  
  IF content_text ~ '^>\s+' THEN  -- Citations
    RETURN true;
  END IF;
  
  -- Si aucune indication de markdown, on considère que c'est peut-être déjà EditorJS ou du texte simple
  -- On ne convertit que si on détecte clairement du markdown
  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Convertir les contenus markdown existants en EditorJS
-- On ne convertit que les contenus qui sont clairement du markdown et qui ne sont pas déjà en format EditorJS
UPDATE public.events
SET content = markdown_to_editorjs_improved(content)::text
WHERE content IS NOT NULL
  AND trim(content) != ''
  AND is_markdown_content(content) = true
  AND (
    -- Ne pas commencer par { "blocks" ou {"blocks" (format EditorJS JSON)
    content::text NOT LIKE '{ "blocks"%' 
    AND content::text NOT LIKE '{"blocks"%'
  );

-- Message de confirmation
DO $$
DECLARE
  converted_count INTEGER;
  total_count INTEGER;
  sample_record RECORD;
BEGIN
  SELECT COUNT(*) INTO converted_count 
  FROM public.events 
  WHERE content IS NOT NULL
    AND trim(content) != ''
    AND (content::text LIKE '{ "blocks"%' OR content::text LIKE '{"blocks"%');
  
  SELECT COUNT(*) INTO total_count
  FROM public.events
  WHERE content IS NOT NULL AND trim(content) != '';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration des événements vers EditorJS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '% événements avec contenu EditorJS', converted_count;
  RAISE NOTICE '% événements avec contenu total', total_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Les contenus markdown ont été convertis en format EditorJS JSON';
  RAISE NOTICE '';
  
  -- Afficher un exemple de conversion
  SELECT title, left(content, 100) as content_sample
  INTO sample_record
  FROM public.events 
  WHERE content IS NOT NULL 
    AND trim(content) != ''
    AND (content::text LIKE '{ "blocks"%' OR content::text LIKE '{"blocks"%')
  LIMIT 1;
  
  IF FOUND THEN
    RAISE NOTICE 'Exemple:';
    RAISE NOTICE 'Titre: %', sample_record.title;
    RAISE NOTICE 'Contenu (100 premiers car.): %', sample_record.content_sample;
    RAISE NOTICE '';
  END IF;
END $$;

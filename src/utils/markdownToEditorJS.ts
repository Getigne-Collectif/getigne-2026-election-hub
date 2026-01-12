import { OutputData } from '@editorjs/editorjs';

/**
 * Convertit du markdown en format EditorJS JSON
 * Cette fonction est utilisée pour migrer les anciens contenus markdown vers EditorJS
 */
export function markdownToEditorJS(markdown: string): OutputData {
  if (!markdown || markdown.trim() === '') {
    return {
      time: Date.now(),
      blocks: [],
      version: '2.28.0'
    };
  }

  const lines = markdown.split('\n');
  const blocks: any[] = [];
  let currentList: string[] = [];
  let currentListStyle: 'unordered' | 'ordered' = 'unordered';
  let inList = false;

  // Fonction pour convertir le formatage inline markdown en HTML
  const convertInlineFormatting = (text: string): string => {
    // Convertir **texte** en <b>texte</b>
    text = text.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    // Convertir __texte__ en <b>texte</b>
    text = text.replace(/__([^_]+)__/g, '<b>$1</b>');
    // Convertir *texte* en <i>texte</i> (mais pas s'il y a déjà un <b>)
    text = text.replace(/(?<!<[^>]*)\*([^*]+)\*(?![^<]*>)/g, '<i>$1</i>');
    // Convertir _texte_ en <i>texte</i>
    text = text.replace(/(?<!<[^>]*)_([^_]+)_(?![^<]*>)/g, '<i>$1</i>');
    // Convertir `code` en <code>code</code>
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    return text;
  };

  const finishList = () => {
    if (inList && currentList.length > 0) {
      blocks.push({
        type: 'list',
        data: {
          style: currentListStyle,
          items: currentList
        }
      });
      currentList = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Ligne vide
    if (trimmed === '') {
      finishList();
      continue;
    }

    // Liste à puces (-, *, +)
    if (/^[\-\*\+]\s+/.test(trimmed)) {
      if (!inList) {
        inList = true;
        currentListStyle = 'unordered';
      }
      const itemText = trimmed.replace(/^[\-\*\+]\s+/, '');
      currentList.push(convertInlineFormatting(itemText));
      continue;
    }

    // Liste numérotée (1., 2., etc.)
    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList || currentListStyle !== 'ordered') {
        finishList();
        inList = true;
        currentListStyle = 'ordered';
      }
      const itemText = trimmed.replace(/^\d+\.\s+/, '');
      currentList.push(convertInlineFormatting(itemText));
      continue;
    }

    // Terminer la liste en cours si on rencontre autre chose
    finishList();

    // Titres (# Titre)
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2];
      blocks.push({
        type: 'header',
        data: {
          text: convertInlineFormatting(text),
          level: level
        }
      });
      continue;
    }

    // Citation (> texte)
    if (trimmed.startsWith('> ')) {
      const quoteText = trimmed.substring(2);
      blocks.push({
        type: 'quote',
        data: {
          text: convertInlineFormatting(quoteText),
          caption: ''
        }
      });
      continue;
    }

    // Séparateur (--- ou ***)
    if (/^[-*]{3,}$/.test(trimmed)) {
      blocks.push({
        type: 'delimiter',
        data: {}
      });
      continue;
    }

    // Code block (```code```)
    if (trimmed.startsWith('```')) {
      const language = trimmed.substring(3).trim();
      let code = '';
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code += lines[i] + '\n';
        i++;
      }
      code = code.trim();
      blocks.push({
        type: 'code',
        data: {
          code: code
        }
      });
      continue;
    }

    // Paragraphe normal
    blocks.push({
      type: 'paragraph',
      data: {
        text: convertInlineFormatting(trimmed)
      }
    });
  }

  // Terminer la liste si on termine avec une liste
  finishList();

  return {
    time: Date.now(),
    blocks: blocks,
    version: '2.28.0'
  };
}

/**
 * Détecte si un contenu est du markdown (simple) ou déjà en format EditorJS
 */
export function isMarkdown(content: string | OutputData): boolean {
  if (typeof content !== 'string') {
    return false; // C'est déjà un objet OutputData
  }

  // Si c'est une chaîne JSON valide qui ressemble à EditorJS
  try {
    const parsed = JSON.parse(content);
    if (parsed.blocks && Array.isArray(parsed.blocks)) {
      return false; // C'est du EditorJS JSON
    }
  } catch {
    // Ce n'est pas du JSON valide, c'est probablement du markdown
  }

  // Vérifier des motifs markdown communs
  const markdownPatterns = [
    /^#{1,6}\s+/m,           // Titres
    /^\*\s+/m,               // Listes
    /^\d+\.\s+/m,            // Listes numérotées
    /\*\*[^*]+\*\*/,         // Gras
    /`[^`]+`/,               // Code inline
    /^>\s+/m                 // Citations
  ];

  return markdownPatterns.some(pattern => pattern.test(content));
}


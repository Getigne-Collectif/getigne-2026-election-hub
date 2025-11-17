import type { OutputData, OutputBlockData } from '@editorjs/editorjs';

/**
 * Convertit le contenu EditorJS en texte simple pour jsPDF
 */
export function editorjsToText(data: OutputData | string): string {
  let parsedData: OutputData;

  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      return data; // Retourner le texte brut si ce n'est pas du JSON valide
    }
  } else {
    parsedData = data;
  }

  if (!parsedData.blocks || !Array.isArray(parsedData.blocks)) {
    return '';
  }

  const textParts: string[] = [];

  parsedData.blocks.forEach((block: OutputBlockData) => {
    switch (block.type) {
      case 'header':
        const text = stripHTML(block.data.text || '');
        textParts.push(text);
        break;

      case 'paragraph':
        const paragraphText = stripHTML(block.data.text || '');
        if (paragraphText.trim()) {
          textParts.push(paragraphText);
        }
        break;

      case 'list':
        const listItems = block.data.items || [];
        listItems.forEach((item: string | { content: string }, index: number) => {
          const content = typeof item === 'string' ? item : item.content || '';
          const prefix = block.data.style === 'ordered' ? `${index + 1}. ` : '• ';
          textParts.push(`${prefix}${stripHTML(content)}`);
        });
        break;

      case 'checklist':
        const checklistItems = block.data.items || [];
        checklistItems.forEach((item: { text: string; checked: boolean }) => {
          const checked = item.checked ? '✓' : '☐';
          const text = stripHTML(item.text || '');
          textParts.push(`${checked} ${text}`);
        });
        break;

      case 'quote':
        const quoteText = stripHTML(block.data.text || '');
        textParts.push(`"${quoteText}"`);
        if (block.data.caption) {
          textParts.push(`— ${stripHTML(block.data.caption)}`);
        }
        break;

      case 'warning':
        if (block.data.title) {
          textParts.push(`⚠ ${stripHTML(block.data.title)}`);
        }
        textParts.push(stripHTML(block.data.message || ''));
        break;

      case 'code':
        textParts.push(block.data.code || '');
        break;

      case 'delimiter':
        textParts.push('* * *');
        break;

      case 'image':
        // Pour les images, on note juste la présence
        if (block.data.caption) {
          textParts.push(`[Image: ${stripHTML(block.data.caption)}]`);
        } else {
          textParts.push('[Image]');
        }
        break;

      case 'table':
        const tableRows = block.data.content || [];
        tableRows.forEach((row: string[]) => {
          const rowText = row.map((cell: string) => stripHTML(cell)).join(' | ');
          textParts.push(rowText);
        });
        break;

      case 'linkTool':
        const linkTitle = block.data.meta?.title || block.data.link || '';
        textParts.push(`🔗 ${stripHTML(linkTitle)}`);
        if (block.data.meta?.description) {
          textParts.push(stripHTML(block.data.meta.description));
        }
        break;

      default:
        // Ignorer les types non supportés
        break;
    }
  });

  return textParts.join('\n\n');
}

/**
 * Supprime les balises HTML d'un texte (pour extraire le texte brut)
 */
function stripHTML(html: string): string {
  if (!html) return '';
  // Utiliser une regex simple pour retirer les balises HTML
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}


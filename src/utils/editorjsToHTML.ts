import type { OutputData, OutputBlockData } from '@editorjs/editorjs';

/**
 * Convertit le contenu EditorJS en HTML simple pour le PDF
 */
export function editorjsToHTML(data: OutputData | string): string {
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

  const htmlParts: string[] = [];

  parsedData.blocks.forEach((block: OutputBlockData) => {
    switch (block.type) {
      case 'header':
        const level = block.data.level || 2;
        const text = stripHTML(block.data.text || '');
        htmlParts.push(`<h${level}>${escapeHtml(text)}</h${level}>`);
        break;

      case 'paragraph':
        const paragraphText = stripHTML(block.data.text || '');
        if (paragraphText.trim()) {
          htmlParts.push(`<p>${escapeHtml(paragraphText)}</p>`);
        }
        break;

      case 'list':
        const listItems = block.data.items || [];
        const listTag = block.data.style === 'ordered' ? 'ol' : 'ul';
        const itemsHtml = listItems
          .map((item: string | { content: string }) => {
            const content = typeof item === 'string' ? item : item.content || '';
            return `<li>${escapeHtml(stripHTML(content))}</li>`;
          })
          .join('');
        htmlParts.push(`<${listTag}>${itemsHtml}</${listTag}>`);
        break;

      case 'checklist':
        const checklistItems = block.data.items || [];
        const checklistHtml = checklistItems
          .map((item: { text: string; checked: boolean }) => {
            const checked = item.checked ? 'checked' : '';
            const text = stripHTML(item.text || '');
            return `<div><input type="checkbox" ${checked} disabled /> <span>${escapeHtml(text)}</span></div>`;
          })
          .join('');
        htmlParts.push(`<div class="checklist">${checklistHtml}</div>`);
        break;

      case 'quote':
        const quoteText = stripHTML(block.data.text || '');
        const caption = block.data.caption ? ` <cite>— ${escapeHtml(stripHTML(block.data.caption))}</cite>` : '';
        htmlParts.push(`<blockquote><p>${escapeHtml(quoteText)}</p>${caption}</blockquote>`);
        break;

      case 'warning':
        const warningTitle = block.data.title ? `<h4>${escapeHtml(stripHTML(block.data.title))}</h4>` : '';
        const warningMessage = escapeHtml(stripHTML(block.data.message || ''));
        htmlParts.push(`<div class="warning">${warningTitle}<p>${warningMessage}</p></div>`);
        break;

      case 'code':
        const code = block.data.code || '';
        htmlParts.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
        break;

      case 'delimiter':
        htmlParts.push('<div class="delimiter">* * *</div>');
        break;

      case 'image':
        const imageUrl = block.data.file?.url || '';
        const imageCaption = block.data.caption ? `<figcaption>${escapeHtml(stripHTML(block.data.caption))}</figcaption>` : '';
        if (imageUrl) {
          htmlParts.push(`<figure><img src="${imageUrl}" alt="${escapeHtml(block.data.caption || '')}" />${imageCaption}</figure>`);
        }
        break;

      case 'table':
        const tableRows = block.data.content || [];
        const rowsHtml = tableRows
          .map((row: string[]) => {
            const cellsHtml = row.map((cell: string) => `<td>${escapeHtml(stripHTML(cell))}</td>`).join('');
            return `<tr>${cellsHtml}</tr>`;
          })
          .join('');
        htmlParts.push(`<table><tbody>${rowsHtml}</tbody></table>`);
        break;

      case 'linkTool':
        const linkUrl = block.data.link || '';
        const linkTitle = block.data.meta?.title || linkUrl;
        const linkDescription = block.data.meta?.description || '';
        htmlParts.push(`<div class="link-tool"><a href="${linkUrl}">${escapeHtml(stripHTML(linkTitle))}</a>${linkDescription ? `<p>${escapeHtml(stripHTML(linkDescription))}</p>` : ''}</div>`);
        break;

      case 'imageCarousel':
        // Pour le PDF, on affiche juste la première image ou un message
        const images = block.data.images || [];
        if (images.length > 0 && images[0].url) {
          htmlParts.push(`<figure><img src="${images[0].url}" alt="Carousel image" /></figure>`);
        }
        break;

      default:
        // Ignorer les types non supportés
        break;
    }
  });

  return htmlParts.join('');
}

/**
 * Supprime les balises HTML d'un texte (pour extraire le texte brut)
 */
function stripHTML(html: string): string {
  if (!html) return '';
  // Utiliser une regex simple pour retirer les balises HTML
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

/**
 * Échappe les caractères HTML spéciaux
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}


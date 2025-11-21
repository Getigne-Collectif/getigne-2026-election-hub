interface API {
  blocks: any;
  caret: any;
  events: any;
  listeners: any;
  notifier: any;
  readonly: boolean;
  sanitizer: any;
  saver: any;
  selection: any;
  styles: any;
  toolbar: any;
  tooltip: any;
  i18n: any;
  inlineToolbar: any;
}

/**
 * StrikethroughTool - Inline tool pour EditorJS permettant de barrer du texte
 */
export default class StrikethroughTool {
  private api: API;
  private button: HTMLButtonElement | null = null;
  private tag = 'S';

  static get isInline(): boolean {
    return true;
  }

  static get title(): string {
    return 'Barrer';
  }

  static get sanitize() {
    return {
      s: {
        class: false,
        id: false,
        style: false
      },
      del: {
        class: false,
        id: false,
        style: false
      }
    };
  }

  constructor({ api }: { api: API }) {
    this.api = api;
  }

  /**
   * Rendu du bouton dans la toolbar
   */
  render(): HTMLButtonElement {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.classList.add('ce-inline-tool', 'strikethrough-tool');
    // Icône Strikethrough de Lucide (S barré)
    this.button.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" style="width: 13px; height: 13px;">
      <path d="M16 4H9a3 3 0 0 0-2.83 4"/>
      <path d="M14 12a4 4 0 0 1 0 8H6"/>
      <line x1="4" y1="12" x2="20" y2="12"/>
    </svg>`;
    this.button.title = 'Barrer le texte';

    return this.button;
  }

  /**
   * Vérifie si le texte sélectionné est déjà barré
   */
  checkState(): boolean {
    const selectedTag = this.api.selection.findParentTag(this.tag) || 
                       this.api.selection.findParentTag('DEL');

    if (this.button) {
      this.button.classList.toggle('ce-inline-tool--active', !!selectedTag);
    }

    return !!selectedTag;
  }

  /**
   * Appelé lorsque l'utilisateur clique sur le bouton
   */
  surround(range: Range): void {
    if (!range || range.collapsed) {
      return;
    }

    // Utiliser l'API de sélection d'EditorJS pour trouver la balise parente
    const selectedTag = this.api.selection.findParentTag(this.tag) || 
                       this.api.selection.findParentTag('DEL');

    if (selectedTag) {
      // Si le texte est déjà barré, on le débarré
      this.unwrap(selectedTag);
    } else {
      // Sinon, on barre le texte
      this.wrap(range);
    }
  }

  /**
   * Entoure la sélection avec une balise <s>
   */
  private wrap(range: Range): void {
    if (!range || range.collapsed) {
      return;
    }

    const wrapper = document.createElement(this.tag);
    
    // Essayer d'abord avec surroundContents (méthode standard)
    try {
      range.surroundContents(wrapper);
      // Si ça fonctionne, utiliser l'API de sélection d'EditorJS
      if (this.api.selection && this.api.selection.expandToTag) {
        this.api.selection.expandToTag(wrapper);
      }
      return;
    } catch (e) {
      // Si surroundContents échoue, utiliser extractContents/insertNode
    }
    
    // Méthode alternative : extractContents/insertNode
    const fragment = range.extractContents();
    
    // Si le fragment est vide, ne rien faire
    if (!fragment || fragment.textContent?.trim() === '') {
      return;
    }
    
    wrapper.appendChild(fragment);
    range.insertNode(wrapper);
    
    // Utiliser l'API de sélection d'EditorJS pour restaurer la sélection
    if (this.api.selection && this.api.selection.expandToTag) {
      this.api.selection.expandToTag(wrapper);
    }
  }

  /**
   * Retire la balise de texte barré
   */
  private unwrap(tag: HTMLElement): void {
    const parent = tag.parentNode;
    if (!parent) return;

    // Créer un range pour restaurer la sélection après
    const range = document.createRange();
    range.setStartBefore(tag);
    range.setEndAfter(tag);

    while (tag.firstChild) {
      parent.insertBefore(tag.firstChild, tag);
    }

    parent.removeChild(tag);

    // Restaurer la sélection avec l'API d'EditorJS
    const selection = window.getSelection();
    if (selection && range) {
      try {
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        // Ignorer les erreurs de range invalide
      }
    }
  }

  /**
   * Nettoie le formatage (appelé quand on appuie sur backspace/delete)
   */
  clear(): void {
    const selectedTag = this.api.selection.findParentTag(this.tag) || 
                       this.api.selection.findParentTag('DEL');
    if (selectedTag) {
      this.unwrap(selectedTag);
    }
  }
}


import { supabase } from '@/integrations/supabase/client';

interface LexiconEntry {
  id: string;
  name: string;
  acronym: string | null;
  content: any;
  external_link: string | null;
  logo_url: string | null;
}

interface AcronymToolConfig {
  placeholder?: string;
}

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
 * AcronymTool - Inline tool pour EditorJS permettant de marquer des acronymes
 * et de les lier à des entrées du lexique
 */
export default class AcronymTool {
  private api: API;
  private button: HTMLButtonElement | null = null;
  private tag = 'SPAN';
  private class = 'acronym';
  private config: AcronymToolConfig;
  private iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
  private lexiconEntries: LexiconEntry[] = [];
  private dropdown: HTMLDivElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private closeDropdownHandler: ((e: MouseEvent) => void) | null = null;
  private savedRange: Range | null = null;

  static get isInline(): boolean {
    return true;
  }

  static get title(): string {
    return 'Lexique';
  }

  static get sanitize() {
    return {
      span: {
        class: 'acronym',
        'data-lexicon-id': true,
        'data-lexicon-term': true
      }
    };
  }

  constructor({ api, config }: { api: API; config?: AcronymToolConfig }) {
    this.api = api;
    this.config = config || {};
    this.loadLexiconEntries();
  }

  /**
   * Charge les entrées du lexique depuis Supabase
   */
  private async loadLexiconEntries(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('lexicon_entries')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erreur lors du chargement du lexique:', error);
        return;
      }

      this.lexiconEntries = data || [];
    } catch (error) {
      console.error('Erreur lors du chargement du lexique:', error);
    }
  }

  /**
   * Rendu du bouton dans la toolbar
   */
  render(): HTMLButtonElement {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.classList.add('ce-inline-tool', 'acronym-tool');
    // Ajouter le style directement dans le SVG
    const styledSvg = this.iconSvg.replace('<svg', '<svg style="width: 13px; height: 13px;"');
    this.button.innerHTML = styledSvg;
    this.button.title = 'Marquer dans le lexique';

    return this.button;
  }

  /**
   * Appelé lorsque l'utilisateur clique sur le bouton
   */
  surround(range: Range): void {
    if (!range) {
      return;
    }

    const selectedText = range.toString();

    if (!selectedText) {
      return;
    }

    // Si le texte est déjà marqué comme acronyme, on le démarque
    const parentSpan = this.api.selection.findParentTag(this.tag, this.class);
    
    if (parentSpan) {
      this.unwrap(parentSpan);
      return;
    }

    // Sinon, on affiche le dropdown pour sélectionner une entrée du lexique
    this.showDropdown(range, selectedText);
  }

  /**
   * Affiche le dropdown de sélection d'entrée du lexique
   */
  private showDropdown(range: Range, selectedText: string): void {
    // Sauvegarder la sélection
    this.savedRange = range.cloneRange();

    // Détecter si on est dans un dialog pour ajuster le positionnement
    const dialogContent = document.querySelector('[role="dialog"]');
    const isInDialog = !!dialogContent;
    const positionType = isInDialog ? 'absolute' : 'fixed';

    // Créer le dropdown
    this.dropdown = document.createElement('div');
    this.dropdown.classList.add('acronym-dropdown');
    this.dropdown.setAttribute('data-acronym-dropdown', 'true');
    
    this.dropdown.style.cssText = `
      position: ${positionType};
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      padding: 12px;
      width: 320px;
      z-index: 999999;
      pointer-events: auto;
    `;
    
    // Empêcher les événements de se propager du dropdown
    this.dropdown.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    
    this.dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Input de recherche
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Rechercher dans le lexique...';
    this.searchInput.classList.add('acronym-search');
    this.searchInput.style.cssText = `
      width: 100%;
      padding: 10px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      margin-bottom: 12px;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
    `;
    
    // Focus style
    this.searchInput.addEventListener('focus', () => {
      this.searchInput!.style.borderColor = '#10b981';
      this.searchInput!.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
    });
    
    this.searchInput.addEventListener('blur', () => {
      this.searchInput!.style.borderColor = '#d1d5db';
      this.searchInput!.style.boxShadow = 'none';
    });

    this.searchInput.addEventListener('input', () => {
      this.filterEntries();
    });
    
    // Empêcher les événements de se propager pour éviter que le dialog ne reprenne le focus
    this.searchInput.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    
    this.searchInput.addEventListener('click', (e) => {
      e.stopPropagation();
      // Forcer le focus au cas où il aurait été perdu
      if (this.searchInput && document.activeElement !== this.searchInput) {
        this.searchInput.focus();
      }
    });

    this.dropdown.appendChild(this.searchInput);

    // Liste des entrées
    const entriesList = document.createElement('div');
    entriesList.classList.add('acronym-entries-list');
    entriesList.style.cssText = `
      max-height: 280px;
      overflow-y: auto;
      margin: -4px;
      padding: 4px;
    `;

    this.lexiconEntries.forEach((entry) => {
      const entryDiv = this.createEntryElement(entry, this.savedRange!);
      entriesList.appendChild(entryDiv);
    });

    this.dropdown.appendChild(entriesList);

    // Ajouter au body ou au dialog si on est dans un dialog
    const container = dialogContent || document.body;
    container.appendChild(this.dropdown);

    // Positionner le dropdown
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      const dropdownRect = this.dropdown.getBoundingClientRect();
      
      let top = rect.bottom + 8;
      let left = rect.left;

      if (isInDialog) {
        // Si on est dans un dialog, calculer la position relative au dialog
        const dialogRect = dialogContent!.getBoundingClientRect();
        top = rect.bottom - dialogRect.top + 8;
        left = rect.left - dialogRect.left;
        
        // Vérifier si le dropdown dépasse en bas du dialog
        if (top + dropdownRect.height > dialogRect.height) {
          top = rect.top - dialogRect.top - dropdownRect.height - 8; // Afficher au-dessus
        }
        
        // Vérifier si le dropdown dépasse à droite du dialog
        if (left + dropdownRect.width > dialogRect.width) {
          left = dialogRect.width - dropdownRect.width - 16;
        }
        
        // S'assurer qu'il ne dépasse pas à gauche
        if (left < 8) {
          left = 8;
        }
      } else {
        // Position fixe normale si on est dans le body
        // Vérifier si le dropdown dépasse en bas
        if (top + dropdownRect.height > window.innerHeight) {
          top = rect.top - dropdownRect.height - 8; // Afficher au-dessus
        }

        // Vérifier si le dropdown dépasse à droite
        if (left + dropdownRect.width > window.innerWidth) {
          left = window.innerWidth - dropdownRect.width - 16;
        }
        
        // S'assurer qu'il ne dépasse pas à gauche
        if (left < 8) {
          left = 8;
        }
      }

      this.dropdown.style.top = `${top}px`;
      this.dropdown.style.left = `${left}px`;
    }

    // Fermer le dropdown si on clique à l'extérieur
    this.closeDropdownHandler = (e: MouseEvent) => {
      if (this.dropdown && !this.dropdown.contains(e.target as Node)) {
        this.closeDropdown();
      }
    };

    // Attendre un peu avant d'ajouter le listener pour ne pas fermer immédiatement
    setTimeout(() => {
      if (this.closeDropdownHandler) {
        document.addEventListener('mousedown', this.closeDropdownHandler);
      }
    }, 100);

    // Focus sur l'input de recherche
    // Utiliser plusieurs tentatives pour forcer le focus même dans un dialog
    const tryFocus = () => {
      if (this.searchInput) {
        this.searchInput.focus();
      }
    };
    
    // Focus immédiat
    tryFocus();
    
    // Réessayer après un court délai pour contrer le focus trap des dialogs
    setTimeout(tryFocus, 10);
    setTimeout(tryFocus, 50);
    setTimeout(tryFocus, 100);
  }

  /**
   * Crée un élément HTML pour une entrée du lexique
   */
  private createEntryElement(entry: LexiconEntry, range: Range): HTMLDivElement {
    const entryDiv = document.createElement('div');
    entryDiv.classList.add('acronym-entry');
    entryDiv.style.cssText = `
      padding: 8px;
      cursor: pointer;
      border-radius: 4px;
      margin-bottom: 4px;
      user-select: none;
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    entryDiv.addEventListener('mouseenter', () => {
      entryDiv.style.backgroundColor = '#f3f4f6';
    });

    entryDiv.addEventListener('mouseleave', () => {
      entryDiv.style.backgroundColor = 'transparent';
    });

    // Logo si disponible
    if (entry.logo_url) {
      const logoImg = document.createElement('img');
      logoImg.src = entry.logo_url;
      logoImg.alt = entry.name;
      logoImg.style.cssText = `
        width: 32px;
        height: 32px;
        object-fit: contain;
        flex-shrink: 0;
        border-radius: 4px;
      `;
      entryDiv.appendChild(logoImg);
    }

    // Conteneur pour le texte
    const textContainer = document.createElement('div');
    textContainer.style.cssText = `
      flex: 1;
      min-width: 0;
    `;

    const nameDiv = document.createElement('div');
    nameDiv.style.fontWeight = '600';
    nameDiv.style.fontSize = '14px';
    nameDiv.style.overflow = 'hidden';
    nameDiv.style.textOverflow = 'ellipsis';
    nameDiv.style.whiteSpace = 'nowrap';
    nameDiv.textContent = entry.name;

    textContainer.appendChild(nameDiv);

    if (entry.acronym) {
      const acronymDiv = document.createElement('div');
      acronymDiv.style.fontSize = '12px';
      acronymDiv.style.color = '#6b7280';
      acronymDiv.style.overflow = 'hidden';
      acronymDiv.style.textOverflow = 'ellipsis';
      acronymDiv.style.whiteSpace = 'nowrap';
      acronymDiv.textContent = entry.acronym;
      textContainer.appendChild(acronymDiv);
    }

    entryDiv.appendChild(textContainer);

    entryDiv.addEventListener('click', () => {
      // Appliquer l'acronyme et fermer la dropdown
      this.wrapSelection(range, entry);
      this.closeDropdown();
    });

    return entryDiv;
  }

  /**
   * Filtre les entrées selon la recherche
   */
  private filterEntries(): void {
    if (!this.dropdown || !this.searchInput || !this.savedRange) return;

    const searchTerm = this.searchInput.value.toLowerCase();
    const entriesList = this.dropdown.querySelector('.acronym-entries-list');

    if (!entriesList) return;

    entriesList.innerHTML = '';

    const filteredEntries = this.lexiconEntries.filter((entry) => {
      const matchName = entry.name.toLowerCase().includes(searchTerm);
      const matchAcronym = entry.acronym?.toLowerCase().includes(searchTerm);
      return matchName || matchAcronym;
    });

    if (filteredEntries.length === 0) {
      const noResults = document.createElement('div');
      noResults.style.padding = '8px';
      noResults.style.color = '#6b7280';
      noResults.style.fontSize = '14px';
      noResults.textContent = 'Aucune entrée trouvée';
      entriesList.appendChild(noResults);
      return;
    }

    filteredEntries.forEach((entry) => {
      const entryDiv = this.createEntryElement(entry, this.savedRange!);
      entriesList.appendChild(entryDiv);
    });
  }

  /**
   * Ferme le dropdown
   */
  private closeDropdown(): void {
    // Nettoyer l'event listener
    if (this.closeDropdownHandler) {
      document.removeEventListener('mousedown', this.closeDropdownHandler);
      this.closeDropdownHandler = null;
    }
    
    // Supprimer le dropdown du DOM
    if (this.dropdown) {
      this.dropdown.remove();
      this.dropdown = null;
      this.searchInput = null;
    }
    
    // Nettoyer la range sauvegardée
    this.savedRange = null;
  }

  /**
   * Entoure la sélection avec un span acronyme
   */
  private wrapSelection(range: Range, entry: LexiconEntry): void {
    const span = document.createElement(this.tag);
    span.classList.add(this.class);
    span.setAttribute('data-lexicon-id', entry.id);
    span.setAttribute('data-lexicon-term', entry.acronym || entry.name);

    try {
      range.surroundContents(span);
    } catch (e) {
      // Si surroundContents échoue (par ex. sélection partielle), on utilise une autre méthode
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    }
  }

  /**
   * Retire le markup acronyme
   */
  private unwrap(element: HTMLElement): void {
    const parent = element.parentNode;
    if (!parent) return;

    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }

    parent.removeChild(element);
  }

  /**
   * Vérifie si le texte sélectionné est déjà marqué comme acronyme
   */
  checkState(): boolean {
    const parentSpan = this.api.selection.findParentTag(this.tag, this.class);

    if (this.button) {
      this.button.classList.toggle('ce-inline-tool--active', !!parentSpan);
    }

    return !!parentSpan;
  }

  /**
   * Nettoie le formatage de l'acronyme (appelé quand on appuie sur backspace/delete)
   */
  clear(): void {
    const parentSpan = this.api.selection.findParentTag(this.tag, this.class);
    if (parentSpan) {
      this.unwrap(parentSpan);
    }
  }

  /**
   * Nettoyer les ressources
   */
  destroy(): void {
    this.closeDropdown();
  }
}


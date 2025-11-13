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
  private iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
  private lexiconEntries: LexiconEntry[] = [];
  private dropdown: HTMLDivElement | null = null;
  private searchInput: HTMLInputElement | null = null;

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
    this.button.classList.add('ce-inline-tool');
    this.button.innerHTML = this.iconSvg;
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
    const savedRange = range.cloneRange();

    // Créer le dropdown
    this.dropdown = document.createElement('div');
    this.dropdown.classList.add('acronym-dropdown');
    this.dropdown.style.cssText = `
      position: fixed;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      padding: 8px;
      max-height: 300px;
      width: 300px;
      overflow-y: auto;
      z-index: 99999;
    `;

    // Input de recherche
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Rechercher dans le lexique...';
    this.searchInput.classList.add('acronym-search');
    this.searchInput.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      margin-bottom: 8px;
      font-size: 14px;
    `;

    this.searchInput.addEventListener('input', () => {
      this.filterEntries();
    });

    this.dropdown.appendChild(this.searchInput);

    // Liste des entrées
    const entriesList = document.createElement('div');
    entriesList.classList.add('acronym-entries-list');

    this.lexiconEntries.forEach((entry) => {
      const entryDiv = this.createEntryElement(entry, savedRange);
      entriesList.appendChild(entryDiv);
    });

    this.dropdown.appendChild(entriesList);

    // Ajouter au body AVANT de calculer la position
    document.body.appendChild(this.dropdown);

    // Positionner le dropdown (fixed positioning)
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      let top = rect.bottom + 5;
      let left = rect.left;

      // Vérifier si le dropdown dépasse en bas
      if (top + 300 > window.innerHeight) {
        top = rect.top - 305; // Afficher au-dessus
      }

      // Vérifier si le dropdown dépasse à droite
      if (left + 300 > window.innerWidth) {
        left = window.innerWidth - 310;
      }

      this.dropdown.style.top = `${top}px`;
      this.dropdown.style.left = `${left}px`;
    }

    // Empêcher la propagation des clics dans le dropdown
    this.dropdown.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    this.dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Fermer le dropdown si on clique à l'extérieur
    const closeDropdown = (e: MouseEvent) => {
      if (this.dropdown && !this.dropdown.contains(e.target as Node)) {
        this.closeDropdown();
        document.removeEventListener('mousedown', closeDropdown, true);
      }
    };

    // Utiliser capture phase pour attraper les clics avant qu'ils n'atteignent d'autres éléments
    setTimeout(() => {
      document.addEventListener('mousedown', closeDropdown, true);
    }, 100);

    // Focus sur l'input de recherche
    this.searchInput.focus();
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
    `;

    entryDiv.addEventListener('mouseenter', () => {
      entryDiv.style.backgroundColor = '#f3f4f6';
    });

    entryDiv.addEventListener('mouseleave', () => {
      entryDiv.style.backgroundColor = 'transparent';
    });

    // Empêcher la propagation pour que le clic fonctionne dans les modales
    entryDiv.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    const nameDiv = document.createElement('div');
    nameDiv.style.fontWeight = '600';
    nameDiv.style.fontSize = '14px';
    nameDiv.textContent = entry.name;

    entryDiv.appendChild(nameDiv);

    if (entry.acronym) {
      const acronymDiv = document.createElement('div');
      acronymDiv.style.fontSize = '12px';
      acronymDiv.style.color = '#6b7280';
      acronymDiv.textContent = entry.acronym;
      entryDiv.appendChild(acronymDiv);
    }

    entryDiv.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.wrapSelection(range, entry);
      this.closeDropdown();
    });

    return entryDiv;
  }

  /**
   * Filtre les entrées selon la recherche
   */
  private filterEntries(): void {
    if (!this.dropdown || !this.searchInput) return;

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
      const savedRange = this.api.selection.save();
      if (savedRange) {
        const entryDiv = this.createEntryElement(entry, savedRange as Range);
        entriesList.appendChild(entryDiv);
      }
    });
  }

  /**
   * Ferme le dropdown
   */
  private closeDropdown(): void {
    if (this.dropdown) {
      this.dropdown.remove();
      this.dropdown = null;
      this.searchInput = null;
    }
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


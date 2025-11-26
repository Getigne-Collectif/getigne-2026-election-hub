/**
 * EditorJS Program Link Tool
 * Custom block for linking to program points or flagship projects
 */

import { supabase } from '@/integrations/supabase/client';

interface ProgramLinkData {
  targetType: 'program_point' | 'flagship' | 'event' | 'article' | 'page';
  targetId: string;
  title?: string; // Cache du titre pour l'affichage en mode édition
  slug?: string; // Slug pour les événements, articles ou page (ex: 'programme', 'contact', 'agenda', 'news')
}

interface ProgramLinkConfig {
  placeholder?: string;
}

interface ProgramLinkAPI {
  blocks: {
    getBlockByIndex: (index: number) => any;
  };
  [key: string]: any;
}

interface BlockAPI {
  dispatchChange?: () => void;
  [key: string]: any;
}

interface ProgramPointOption {
  id: string;
  title: string;
  programItemTitle?: string;
}

interface FlagshipOption {
  id: string;
  title: string;
}

interface EventOption {
  id: string;
  title: string;
  slug: string | null;
  date: string;
}

interface ArticleOption {
  id: string;
  title: string;
  slug: string | null;
}

export default class ProgramLinkTool {
  private api: ProgramLinkAPI;
  private block?: BlockAPI;
  private readOnly: boolean;
  private data: ProgramLinkData;
  private wrapper: HTMLElement | null = null;
  private config: ProgramLinkConfig;
  private programPoints: ProgramPointOption[] = [];
  private flagshipProjects: FlagshipOption[] = [];
  private events: EventOption[] = [];
  private articles: ArticleOption[] = [];
  private dropdown: HTMLDivElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private closeDropdownHandler: ((e: MouseEvent) => void) | null = null;
  private selectedType: 'program_point' | 'flagship' | 'event' | 'article' | 'page' | null = null;

  static get toolbox() {
    return {
      title: 'Maillage interne',
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2L3 7v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7l-7-5z" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7 10h6M7 13h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, api, readOnly, config, block }: {
    data?: ProgramLinkData;
    api: ProgramLinkAPI;
    readOnly?: boolean;
    config?: ProgramLinkConfig;
    block?: BlockAPI;
  }) {
    this.api = api;
    this.block = block;
    this.readOnly = readOnly || false;
    this.config = config || {};
    this.data = {
      targetType: data?.targetType || 'program_point',
      targetId: data?.targetId || '',
      title: data?.title,
      slug: data?.slug || (data?.targetType === 'page' ? data?.targetId : undefined)
    };
    this.loadOptions();
  }

  /**
   * Charge les points de programme, flagships, événements et articles depuis Supabase
   */
  private async loadOptions(): Promise<void> {
    try {
      // Charger les points de programme avec leurs items
      const { data: pointsData, error: pointsError } = await supabase
        .from('program_points')
        .select('id, title, program_items(title)')
        .order('title', { ascending: true });

      if (pointsError) {
        console.error('Erreur lors du chargement des points de programme:', pointsError);
      } else {
        this.programPoints = (pointsData || []).map((point: any) => ({
          id: point.id,
          title: point.title,
          programItemTitle: Array.isArray(point.program_items) && point.program_items.length > 0
            ? point.program_items[0].title
            : point.program_items?.title
        }));
      }

      // Charger les flagships
      const { data: flagshipsData, error: flagshipsError } = await supabase
        .from('program_flagship_projects')
        .select('id, title')
        .order('title', { ascending: true });

      if (flagshipsError) {
        console.error('Erreur lors du chargement des flagships:', flagshipsError);
      } else {
        this.flagshipProjects = (flagshipsData || []).map((project: any) => ({
          id: project.id,
          title: project.title
        }));
      }

      // Charger les événements (passés et futurs)
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, slug, date')
        .order('date', { ascending: false });

      if (eventsError) {
        console.error('Erreur lors du chargement des événements:', eventsError);
      } else {
        this.events = (eventsData || []).map((event: any) => ({
          id: event.id,
          title: event.title,
          slug: event.slug,
          date: event.date
        }));
      }

      // Charger les articles publiés
      const { data: articlesData, error: articlesError } = await supabase
        .from('news')
        .select('id, title, slug')
        .eq('status', 'published')
        .order('date', { ascending: false });

      if (articlesError) {
        console.error('Erreur lors du chargement des articles:', articlesError);
      } else {
        this.articles = (articlesData || []).map((article: any) => ({
          id: article.id,
          title: article.title,
          slug: article.slug
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des options:', error);
    }
  }

  render() {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('cdx-program-link-tool');
    this.wrapper.setAttribute('contenteditable', 'false');

    if (this.readOnly) {
      this.renderView();
    } else {
      this.renderSettings();
    }

    return this.wrapper;
  }

  private renderView() {
    if (!this.wrapper) return;

    const container = document.createElement('div');
    container.className = 'program-link-preview';
    
    if (this.data.targetId && this.data.title) {
      container.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1), rgba(16, 185, 129, 0.1)); border: 2px solid rgba(16, 185, 129, 0.3); border-radius: 12px; margin: 8px 0;">
          <div style="width: 64px; height: 64px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: linear-gradient(to bottom right, #10b981, #06b6d4); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            ${this.data.targetType === 'page' 
              ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>'
              : `<span style="color: white; font-size: 24px; font-weight: bold;">${this.data.targetType === 'program_point' ? '📋' : this.data.targetType === 'flagship' ? '⭐' : this.data.targetType === 'event' ? '📅' : '📰'}</span>`
            }
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 11px; font-weight: 600; color: #10b981; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
              ${this.data.targetType === 'program_point' ? 'Point de programme' : this.data.targetType === 'flagship' ? 'Projet phare' : this.data.targetType === 'event' ? 'Événement' : this.data.targetType === 'article' ? 'Article' : 'Page'}
            </div>
            <div style="font-weight: 700; color: #111827; font-size: 16px; line-height: 1.3;">
              ${this.data.title}
            </div>
          </div>
          <button type="button" class="program-link-navigate-btn" style="padding: 10px 20px; background: linear-gradient(to right, #10b981, #06b6d4); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; white-space: nowrap; margin-left: 12px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3); transition: all 0.2s;">
            Voir →
          </button>
        </div>
      `;

      // Attacher le listener de navigation
      const navigateBtn = container.querySelector('.program-link-navigate-btn');
      navigateBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.navigateToTarget();
      });
      
      // Ajouter un effet hover
      const card = container.querySelector('div');
      if (card) {
        card.addEventListener('mouseenter', () => {
          (card as HTMLElement).style.borderColor = 'rgba(16, 185, 129, 0.5)';
          (card as HTMLElement).style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.2)';
        });
        card.addEventListener('mouseleave', () => {
          (card as HTMLElement).style.borderColor = 'rgba(16, 185, 129, 0.3)';
          (card as HTMLElement).style.boxShadow = 'none';
        });
      }
    } else {
      container.innerHTML = `
        <div style="padding: 20px; border: 2px dashed #e5e7eb; border-radius: 8px; text-align: center; background: #f9fafb; color: #6b7280;">
          Lien vers un point de programme ou un flagship
        </div>
      `;
    }

    this.wrapper.innerHTML = '';
    this.wrapper.appendChild(container);
  }

  private renderSettings() {
    if (!this.wrapper) return;

    const container = document.createElement('div');
    container.className = 'program-link-settings';
    
    if (this.data.targetId && this.data.title) {
      // Afficher la card avec possibilité de changer
      container.innerHTML = `
        <div style="padding: 16px; border: 2px solid #10b981; border-radius: 12px; background: linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1));">
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
            <div style="width: 64px; height: 64px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: linear-gradient(to bottom right, #10b981, #06b6d4); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              ${this.data.targetType === 'page' 
                ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>'
                : `<span style="color: white; font-size: 24px; font-weight: bold;">${this.data.targetType === 'program_point' ? '📋' : this.data.targetType === 'flagship' ? '⭐' : this.data.targetType === 'event' ? '📅' : '📰'}</span>`
              }
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 11px; color: #10b981; margin-bottom: 4px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">
                ${this.data.targetType === 'program_point' ? 'Point de programme' : this.data.targetType === 'flagship' ? 'Projet phare' : this.data.targetType === 'event' ? 'Événement' : this.data.targetType === 'article' ? 'Article' : 'Page'}
              </div>
              <div style="font-weight: 700; color: #111827; font-size: 16px; line-height: 1.3;">
                ${this.data.title}
              </div>
            </div>
          </div>
          <button type="button" class="change-link-btn" style="padding: 10px 16px; background: linear-gradient(to right, #10b981, #06b6d4); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; width: 100%; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3); transition: all 0.2s;">
            Changer la cible
          </button>
        </div>
      `;

      const changeBtn = container.querySelector('.change-link-btn');
      changeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showSelectionDropdown();
      });
    } else {
      // Afficher le bouton pour sélectionner
      container.innerHTML = `
        <div style="padding: 20px; border: 2px dashed #3b82f6; border-radius: 8px; background: #eff6ff; text-align: center;">
          <div style="font-weight: 600; color: #1e40af; margin-bottom: 12px;">
            Maillage interne
          </div>
          <button type="button" class="select-link-btn" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Sélectionner une cible
          </button>
        </div>
      `;

      const selectBtn = container.querySelector('.select-link-btn');
      selectBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showSelectionDropdown();
      });
    }

    this.wrapper.innerHTML = '';
    this.wrapper.appendChild(container);
  }

  private showSelectionDropdown() {
    // Détecter si on est dans un dialog
    const dialogContent = document.querySelector('[role="dialog"]');
    const isInDialog = !!dialogContent;
    const positionType = isInDialog ? 'absolute' : 'fixed';

    // Créer le dropdown
    this.dropdown = document.createElement('div');
    this.dropdown.classList.add('program-link-dropdown');
    this.dropdown.setAttribute('data-program-link-dropdown', 'true');
    
    this.dropdown.style.cssText = `
      position: ${positionType};
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      padding: 12px;
      width: 400px;
      max-height: 500px;
      z-index: 999999;
      pointer-events: auto;
    `;

    // Empêcher les événements de se propager
    this.dropdown.addEventListener('mousedown', (e) => e.stopPropagation());
    this.dropdown.addEventListener('click', (e) => e.stopPropagation());

    // Select pour choisir le type
    const selectContainer = document.createElement('div');
    selectContainer.style.cssText = 'margin-bottom: 12px;';
    
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Type de lien';
    typeLabel.style.cssText = 'display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;';
    selectContainer.appendChild(typeLabel);

    const typeSelect = document.createElement('select');
    typeSelect.style.cssText = `
      width: 100%;
      padding: 10px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
      background: white;
      cursor: pointer;
    `;
    
    const options = [
      { value: 'program_point', label: 'Point de programme' },
      { value: 'flagship', label: 'Projet phare' },
      { value: 'event', label: 'Événement' },
      { value: 'article', label: 'Article' },
      { value: 'page', label: 'Page' }
    ];

    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === (this.selectedType || 'program_point')) {
        option.selected = true;
      }
      typeSelect.appendChild(option);
    });

    typeSelect.addEventListener('change', (e) => {
      this.selectedType = (e.target as HTMLSelectElement).value as any;
      this.updateDropdownContent();
    });

    typeSelect.addEventListener('focus', () => {
      typeSelect.style.borderColor = '#10b981';
      typeSelect.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
    });
    
    typeSelect.addEventListener('blur', () => {
      typeSelect.style.borderColor = '#d1d5db';
      typeSelect.style.boxShadow = 'none';
    });

    selectContainer.appendChild(typeSelect);
    this.dropdown.appendChild(selectContainer);

    // Input de recherche
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Rechercher...';
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
    
    this.searchInput.addEventListener('focus', () => {
      this.searchInput!.style.borderColor = '#10b981';
      this.searchInput!.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
    });
    
    this.searchInput.addEventListener('blur', () => {
      this.searchInput!.style.borderColor = '#d1d5db';
      this.searchInput!.style.boxShadow = 'none';
    });

    this.searchInput.addEventListener('input', () => {
      this.updateDropdownContent();
    });
    
    this.searchInput.addEventListener('mousedown', (e) => e.stopPropagation());
    this.searchInput.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.searchInput && document.activeElement !== this.searchInput) {
        this.searchInput.focus();
      }
    });

    this.dropdown.appendChild(this.searchInput);

    // Liste des options
    const optionsList = document.createElement('div');
    optionsList.classList.add('program-link-options-list');
    optionsList.style.cssText = `
      max-height: 300px;
      overflow-y: auto;
    `;
    this.dropdown.appendChild(optionsList);

    // Initialiser le type sélectionné
    if (!this.selectedType) {
      this.selectedType = 'program_point';
    }

    // Ajouter au DOM
    const container = dialogContent || document.body;
    container.appendChild(this.dropdown);

    // Positionner le dropdown
    this.positionDropdown(isInDialog, dialogContent);

    // Fermer le dropdown si on clique à l'extérieur
    this.closeDropdownHandler = (e: MouseEvent) => {
      if (this.dropdown && !this.dropdown.contains(e.target as Node)) {
        this.closeDropdown();
      }
    };

    setTimeout(() => {
      if (this.closeDropdownHandler) {
        document.addEventListener('mousedown', this.closeDropdownHandler);
      }
    }, 100);

    // Focus sur l'input
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.focus();
      }
    }, 10);

    // Mettre à jour le contenu
    this.updateDropdownContent();
  }

  private updateDropdownContent() {
    if (!this.dropdown) return;

    const optionsList = this.dropdown.querySelector('.program-link-options-list');
    if (!optionsList) return;

    optionsList.innerHTML = '';

    const searchTerm = (this.searchInput?.value || '').toLowerCase();
    const currentType = this.selectedType || 'program_point';

    let options: (ProgramPointOption | FlagshipOption | EventOption | ArticleOption | { id: string; title: string; slug: string })[] = [];
    if (currentType === 'program_point') {
      options = this.programPoints.filter(option => 
        option.title.toLowerCase().includes(searchTerm) ||
        option.programItemTitle?.toLowerCase().includes(searchTerm)
      );
    } else if (currentType === 'flagship') {
      options = this.flagshipProjects.filter(option =>
        option.title.toLowerCase().includes(searchTerm)
      );
    } else if (currentType === 'event') {
      options = this.events.filter(option =>
        option.title.toLowerCase().includes(searchTerm)
      );
    } else if (currentType === 'article') {
      options = this.articles.filter(option =>
        option.title.toLowerCase().includes(searchTerm)
      );
    } else if (currentType === 'page') {
      // Pages statiques
      const staticPages = [
        { id: 'programme', title: 'Programme', slug: 'programme' },
        { id: 'contact', title: 'Contact', slug: 'contact' },
        { id: 'agenda', title: 'Agenda', slug: 'agenda' },
        { id: 'news', title: 'Actualités', slug: 'news' }
      ];
      options = staticPages.filter(page =>
        page.title.toLowerCase().includes(searchTerm) ||
        page.slug.toLowerCase().includes(searchTerm)
      );
    }

    if (options.length === 0) {
      const noResults = document.createElement('div');
      noResults.style.cssText = 'padding: 20px; text-align: center; color: #6b7280; font-size: 14px;';
      noResults.textContent = 'Aucun résultat trouvé';
      optionsList.appendChild(noResults);
      return;
    }

    options.forEach((option) => {
      const optionDiv = document.createElement('div');
      optionDiv.style.cssText = `
        padding: 12px;
        cursor: pointer;
        border-radius: 6px;
        margin-bottom: 4px;
        user-select: none;
        transition: background-color 0.2s;
      `;

      optionDiv.addEventListener('mouseenter', () => {
        optionDiv.style.backgroundColor = '#f3f4f6';
      });

      optionDiv.addEventListener('mouseleave', () => {
        optionDiv.style.backgroundColor = 'transparent';
      });

      const titleDiv = document.createElement('div');
      titleDiv.style.cssText = 'font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 4px;';
      titleDiv.textContent = option.title;

      optionDiv.appendChild(titleDiv);

      if (currentType === 'program_point' && 'programItemTitle' in option && option.programItemTitle) {
        const subtitleDiv = document.createElement('div');
        subtitleDiv.style.cssText = 'font-size: 12px; color: #6b7280;';
        subtitleDiv.textContent = option.programItemTitle;
        optionDiv.appendChild(subtitleDiv);
      } else if (currentType === 'event' && 'date' in option && option.date) {
        const dateDiv = document.createElement('div');
        const eventDate = new Date(option.date);
        const now = new Date();
        const isPast = eventDate < now;
        dateDiv.style.cssText = `font-size: 12px; color: ${isPast ? '#9ca3af' : '#10b981'};`;
        dateDiv.textContent = isPast ? `Passé - ${eventDate.toLocaleDateString('fr-FR')}` : `À venir - ${eventDate.toLocaleDateString('fr-FR')}`;
        optionDiv.appendChild(dateDiv);
      }

      optionDiv.addEventListener('click', () => {
        const slug = 'slug' in option ? option.slug : undefined;
        // Pour les pages, utiliser le slug comme targetId
        const targetId = currentType === 'page' && slug ? slug : option.id;
        this.selectTarget(currentType, targetId, option.title, slug);
        this.closeDropdown();
      });

      optionsList.appendChild(optionDiv);
    });

    // Mettre à jour le select
    const select = this.dropdown.querySelector('select');
    if (select) {
      select.value = currentType;
    }
  }

  private positionDropdown(isInDialog: boolean, dialogContent: Element | null) {
    if (!this.dropdown) return;

    const rect = this.wrapper?.getBoundingClientRect();
    if (!rect) return;

    const dropdownRect = this.dropdown.getBoundingClientRect();
    let top = rect.bottom + 8;
    let left = rect.left;

    if (isInDialog && dialogContent) {
      const dialogRect = dialogContent.getBoundingClientRect();
      top = rect.bottom - dialogRect.top + 8;
      left = rect.left - dialogRect.left;

      if (top + dropdownRect.height > dialogRect.height) {
        top = rect.top - dialogRect.top - dropdownRect.height - 8;
      }

      if (left + dropdownRect.width > dialogRect.width) {
        left = dialogRect.width - dropdownRect.width - 16;
      }

      if (left < 8) {
        left = 8;
      }
    } else {
      if (top + dropdownRect.height > window.innerHeight) {
        top = rect.top - dropdownRect.height - 8;
      }

      if (left + dropdownRect.width > window.innerWidth) {
        left = window.innerWidth - dropdownRect.width - 16;
      }

      if (left < 8) {
        left = 8;
      }
    }

    this.dropdown.style.top = `${top}px`;
    this.dropdown.style.left = `${left}px`;
  }

  private selectTarget(targetType: 'program_point' | 'flagship' | 'event' | 'article' | 'page', targetId: string, title: string, slug?: string | null) {
    this.data = {
      targetType,
      targetId,
      title,
      slug: slug || (targetType === 'page' ? targetId : undefined)
    };

    this.rerender();
    this.block?.dispatchChange?.();
  }

  private closeDropdown() {
    if (this.closeDropdownHandler) {
      document.removeEventListener('mousedown', this.closeDropdownHandler);
      this.closeDropdownHandler = null;
    }

    if (this.dropdown) {
      this.dropdown.remove();
      this.dropdown = null;
      this.searchInput = null;
    }
  }

  private navigateToTarget() {
    if (this.data.targetType === 'program_point' || this.data.targetType === 'flagship') {
      const anchorId = this.data.targetType === 'program_point' 
        ? `program-point-${this.data.targetId}`
        : `flagship-${this.data.targetId}`;

      if (window.location.pathname === '/programme') {
        // On est déjà sur la page programme, scroller
        const element = document.getElementById(anchorId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.history.pushState(null, '', `#${anchorId}`);
        }
      } else {
        // Naviguer vers la page programme avec l'ancre
        window.location.href = `/programme#${anchorId}`;
      }
    } else if (this.data.targetType === 'event') {
      // Naviguer vers la page de l'événement
      const eventPath = this.data.slug ? `/agenda/${this.data.slug}` : `/agenda/${this.data.targetId}`;
      window.location.href = eventPath;
    } else if (this.data.targetType === 'article') {
      // Naviguer vers la page de l'article
      const articlePath = this.data.slug ? `/news/${this.data.slug}` : `/news/${this.data.targetId}`;
      window.location.href = articlePath;
    } else if (this.data.targetType === 'page') {
      // Naviguer vers la page statique
      const pagePath = `/${this.data.slug || this.data.targetId}`;
      window.location.href = pagePath;
    }
  }

  private rerender() {
    if (!this.wrapper) return;

    if (this.readOnly) {
      this.renderView();
    } else {
      this.renderSettings();
    }
  }

  save(): ProgramLinkData {
    return {
      targetType: this.data.targetType,
      targetId: this.data.targetId,
      title: this.data.title,
      slug: this.data.slug
    };
  }

  static get sanitize() {
    return {
      targetType: {},
      targetId: {},
      title: {},
      slug: {}
    };
  }
}


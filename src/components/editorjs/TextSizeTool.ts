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

type TextSize = 'small' | 'normal' | 'large' | 'x-large' | 'xx-large';

/**
 * TextSizeTool - Inline tool pour EditorJS permettant de modifier la taille du texte
 * Cycle entre small → normal → large → x-large → xx-large → small
 */
export default class TextSizeTool {
  private api: API;
  private button: HTMLButtonElement | null = null;
  private currentSize: TextSize = 'normal';

  static get isInline(): boolean {
    return true;
  }

  static get title(): string {
    return 'Taille du texte';
  }

  static get sanitize() {
    return {
      '*': {
        style: {
          'font-size': true
        }
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
    this.button.classList.add('ce-inline-tool', 'text-size-tool');
    
    // Initialiser avec la taille actuelle
    const currentSize = this.getCurrentSize();
    this.currentSize = currentSize;
    this.updateIcon(currentSize);
    this.checkState();

    return this.button;
  }

  /**
   * Convertit une taille en valeur CSS
   */
  private getSizeValue(size: TextSize): string {
    const sizeMap: Record<TextSize, string> = {
      'small': '0.875rem',      // 14px
      'normal': '1rem',         // 16px (par défaut)
      'large': '1.25rem',       // 20px
      'x-large': '1.5rem',      // 24px
      'xx-large': '2rem'        // 32px
    };
    return sizeMap[size];
  }

  /**
   * Convertit une valeur CSS en taille
   */
  private parseSizeValue(value: string): TextSize {
    // Normaliser la valeur (enlever les espaces, convertir en minuscules)
    const normalized = value.trim().toLowerCase();
    
    // Vérifier les valeurs exactes
    if (normalized === '0.875rem' || normalized === '14px' || normalized === 'small') return 'small';
    if (normalized === '1rem' || normalized === '16px' || normalized === 'normal' || normalized === 'medium') return 'normal';
    if (normalized === '1.25rem' || normalized === '20px' || normalized === 'large') return 'large';
    if (normalized === '1.5rem' || normalized === '24px' || normalized === 'x-large') return 'x-large';
    if (normalized === '2rem' || normalized === '32px' || normalized === 'xx-large') return 'xx-large';
    
    // Essayer de parser la valeur numérique
    const numericMatch = normalized.match(/(\d+\.?\d*)(rem|px)/);
    if (numericMatch) {
      const num = parseFloat(numericMatch[1]);
      const unit = numericMatch[2];
      
      if (unit === 'rem') {
        if (num <= 0.875) return 'small';
        if (num <= 1) return 'normal';
        if (num <= 1.25) return 'large';
        if (num <= 1.5) return 'x-large';
        return 'xx-large';
      } else if (unit === 'px') {
        if (num <= 14) return 'small';
        if (num <= 16) return 'normal';
        if (num <= 20) return 'large';
        if (num <= 24) return 'x-large';
        return 'xx-large';
      }
    }
    
    return 'normal';
  }

  /**
   * Met à jour l'icône selon la taille
   */
  private updateIcon(size: TextSize): void {
    if (!this.button) return;

    let iconSvg = '';
    let title = '';

    switch (size) {
      case 'small':
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 20px; height: 20px;">
          <text x="12" y="17" font-size="13" font-weight="bold" fill="currentColor" text-anchor="middle" dominant-baseline="middle">T1</text>
        </svg>`;
        title = 'Taille: Petite (T1)';
        break;
      case 'normal':
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 20px; height: 20px;">
          <text x="12" y="17" font-size="13" font-weight="bold" fill="currentColor" text-anchor="middle" dominant-baseline="middle">T2</text>
        </svg>`;
        title = 'Taille: Normale (T2)';
        break;
      case 'large':
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 20px; height: 20px;">
          <text x="12" y="17" font-size="13" font-weight="bold" fill="currentColor" text-anchor="middle" dominant-baseline="middle">T3</text>
        </svg>`;
        title = 'Taille: Grande (T3)';
        break;
      case 'x-large':
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 20px; height: 20px;">
          <text x="12" y="17" font-size="13" font-weight="bold" fill="currentColor" text-anchor="middle" dominant-baseline="middle">T4</text>
        </svg>`;
        title = 'Taille: Très grande (T4)';
        break;
      case 'xx-large':
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 20px; height: 20px;">
          <text x="12" y="17" font-size="13" font-weight="bold" fill="currentColor" text-anchor="middle" dominant-baseline="middle">T5</text>
        </svg>`;
        title = 'Taille: Extra grande (T5)';
        break;
    }

    this.button.innerHTML = iconSvg;
    this.button.title = title;
  }

  /**
   * Récupère la taille actuelle du bloc
   */
  private getCurrentSize(): TextSize {
    try {
      const currentBlock = this.api.blocks.getCurrentBlockIndex();
      if (currentBlock === -1) return 'normal';

      const blockElement = this.api.blocks.getBlockByIndex(currentBlock);
      if (!blockElement) return 'normal';

      // D'abord, vérifier si la taille est sauvegardée dans les données du bloc
      const blockData = blockElement.data;
      if (blockData && blockData.textSize) {
        const savedSize = blockData.textSize as TextSize;
        if (['small', 'normal', 'large', 'x-large', 'xx-large'].includes(savedSize)) {
          return savedSize;
        }
      }

      // Sinon, vérifier le style CSS appliqué
      const blockContent = blockElement.holder?.querySelector('.ce-block__content');
      if (!blockContent) return 'normal';

      const computedStyle = window.getComputedStyle(blockContent);
      const fontSize = computedStyle.fontSize;

      return this.parseSizeValue(fontSize);
    } catch (e) {
      return 'normal';
    }
  }

  /**
   * Passe à la taille suivante dans le cycle
   */
  private getNextSize(current: TextSize): TextSize {
    const cycle: TextSize[] = ['small', 'normal', 'large', 'x-large', 'xx-large'];
    const currentIndex = cycle.indexOf(current);
    const nextIndex = (currentIndex + 1) % cycle.length;
    return cycle[nextIndex];
  }

  /**
   * Applique la taille au bloc actuel
   */
  private applySize(size: TextSize): void {
    try {
      const currentBlock = this.api.blocks.getCurrentBlockIndex();
      if (currentBlock === -1) return;

      const blockElement = this.api.blocks.getBlockByIndex(currentBlock);
      if (!blockElement) return;

      const blockContent = blockElement.holder?.querySelector('.ce-block__content');
      if (!blockContent) return;

      // Appliquer la taille visuellement
      const sizeValue = this.getSizeValue(size);
      (blockContent as HTMLElement).style.fontSize = sizeValue;

      // Sauvegarder la taille dans les données du bloc
      // Modifier directement les données du bloc
      if (blockElement.data) {
        blockElement.data.textSize = size;
      }

      // Mettre à jour l'icône pour afficher la taille actuelle
      this.currentSize = size;
      this.updateIcon(size);
      this.checkState();

      // Forcer la sauvegarde et déclencher onChange
      // On utilise un petit délai pour s'assurer que le style est bien appliqué dans le DOM
      const savedBlockElement = blockElement;
      setTimeout(() => {
        // Déclencher manuellement un événement de changement
        // Cela forcera EditorJS à appeler onChange qui interceptera la taille
        try {
          // Essayer de déclencher un événement de changement sur le bloc
          if (savedBlockElement && (savedBlockElement as any).dispatchChange) {
            (savedBlockElement as any).dispatchChange();
          }
          // Sinon, forcer la sauvegarde qui déclenchera onChange
          this.api.saver.save();
        } catch (e) {
          // Si ça échoue, forcer quand même la sauvegarde
          this.api.saver.save();
        }
      }, 50);
    } catch (e) {
      console.error('Erreur lors de l\'application de la taille:', e);
    }
  }

  /**
   * Vérifie l'état actuel de la taille
   */
  checkState(): boolean {
    const size = this.getCurrentSize();
    this.currentSize = size;
    
    // Mettre à jour l'icône pour afficher la taille actuelle
    this.updateIcon(size);

    // Activer le bouton si la taille n'est pas 'normal' (valeur par défaut)
    if (this.button) {
      if (size !== 'normal') {
        this.button.classList.add('ce-inline-tool--active');
      } else {
        this.button.classList.remove('ce-inline-tool--active');
      }
    }

    return size !== 'normal';
  }

  /**
   * Appelé lorsque l'utilisateur clique sur le bouton
   */
  surround(range: Range): void {
    const currentSize = this.getCurrentSize();
    const nextSize = this.getNextSize(currentSize);
    this.applySize(nextSize);
  }

  /**
   * Nettoie le formatage (non utilisé pour la taille)
   */
  clear(): void {
    // Ne rien faire pour la taille
  }
}


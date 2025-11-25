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

type TextAlign = 'left' | 'center' | 'right' | 'justify';

/**
 * TextAlignTool - Inline tool pour EditorJS permettant de modifier l'alignement du texte
 * Cycle entre left → center → right → justify → left
 */
export default class TextAlignTool {
  private api: API;
  private button: HTMLButtonElement | null = null;
  private currentAlign: TextAlign = 'left';

  static get isInline(): boolean {
    return true;
  }

  static get title(): string {
    return 'Alignement';
  }

  static get sanitize() {
    return {
      '*': {
        style: {
          'text-align': true
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
    this.button.classList.add('ce-inline-tool', 'text-align-tool');
    
    // Initialiser avec l'alignement actuel
    const currentAlign = this.getCurrentAlign();
    this.currentAlign = currentAlign;
    this.updateIcon(currentAlign);
    this.checkState();

    return this.button;
  }

  /**
   * Met à jour l'icône selon l'alignement
   */
  private updateIcon(align: TextAlign): void {
    if (!this.button) return;

    let iconSvg = '';
    let title = '';

    switch (align) {
      case 'left':
        iconSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" style="width: 13px; height: 13px;">
          <line x1="21" y1="6" x2="3" y2="6"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
          <line x1="17" y1="18" x2="3" y2="18"/>
        </svg>`;
        title = 'Alignement: Gauche';
        break;
      case 'center':
        iconSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" style="width: 13px; height: 13px;">
          <line x1="21" y1="6" x2="3" y2="6"/>
          <line x1="17" y1="12" x2="7" y2="12"/>
          <line x1="19" y1="18" x2="5" y2="18"/>
        </svg>`;
        title = 'Alignement: Centré';
        break;
      case 'right':
        iconSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" style="width: 13px; height: 13px;">
          <line x1="21" y1="6" x2="3" y2="6"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
          <line x1="21" y1="18" x2="7" y2="18"/>
        </svg>`;
        title = 'Alignement: Droite';
        break;
      case 'justify':
        iconSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" style="width: 13px; height: 13px;">
          <line x1="21" y1="6" x2="3" y2="6"/>
          <line x1="21" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="18" x2="3" y2="18"/>
        </svg>`;
        title = 'Alignement: Justifié';
        break;
    }

    this.button.innerHTML = iconSvg;
    this.button.title = title;
  }

  /**
   * Récupère l'alignement actuel du bloc
   */
  private getCurrentAlign(): TextAlign {
    try {
      const currentBlock = this.api.blocks.getCurrentBlockIndex();
      if (currentBlock === -1) return 'left';

      const blockElement = this.api.blocks.getBlockByIndex(currentBlock);
      if (!blockElement) return 'left';

      // D'abord, vérifier si l'alignement est sauvegardé dans les données du bloc
      const blockData = blockElement.data;
      if (blockData && blockData.textAlign) {
        const savedAlign = blockData.textAlign as TextAlign;
        if (['left', 'center', 'right', 'justify'].includes(savedAlign)) {
          return savedAlign;
        }
      }

      // Sinon, vérifier le style CSS appliqué
      const blockContent = blockElement.holder?.querySelector('.ce-block__content');
      if (!blockContent) return 'left';

      const computedStyle = window.getComputedStyle(blockContent);
      const textAlign = computedStyle.textAlign as TextAlign;

      // Normaliser les valeurs
      if (textAlign === 'start' || textAlign === 'left' || !textAlign) {
        return 'left';
      }
      if (textAlign === 'end' || textAlign === 'right') {
        return 'right';
      }
      if (textAlign === 'center') {
        return 'center';
      }
      if (textAlign === 'justify') {
        return 'justify';
      }

      return 'left';
    } catch (e) {
      return 'left';
    }
  }

  /**
   * Passe à l'alignement suivant dans le cycle
   */
  private getNextAlign(current: TextAlign): TextAlign {
    const cycle: TextAlign[] = ['left', 'center', 'right', 'justify'];
    const currentIndex = cycle.indexOf(current);
    const nextIndex = (currentIndex + 1) % cycle.length;
    return cycle[nextIndex];
  }

  /**
   * Applique l'alignement au bloc actuel
   */
  private applyAlign(align: TextAlign): void {
    try {
      const currentBlock = this.api.blocks.getCurrentBlockIndex();
      if (currentBlock === -1) return;

      const blockElement = this.api.blocks.getBlockByIndex(currentBlock);
      if (!blockElement) return;

      const blockContent = blockElement.holder?.querySelector('.ce-block__content');
      if (!blockContent) return;

      // Appliquer l'alignement visuellement
      (blockContent as HTMLElement).style.textAlign = align;

      // Sauvegarder l'alignement dans les données du bloc
      // Modifier directement les données du bloc
      if (blockElement.data) {
        blockElement.data.textAlign = align;
      }

      // Mettre à jour l'icône pour afficher l'alignement actuel
      this.currentAlign = align;
      this.updateIcon(align);
      this.checkState();

      // Forcer la sauvegarde et déclencher onChange
      // On utilise un petit délai pour s'assurer que le style est bien appliqué dans le DOM
      const savedBlockElement = blockElement;
      setTimeout(() => {
        // Déclencher manuellement un événement de changement
        // Cela forcera EditorJS à appeler onChange qui interceptera l'alignement
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
      console.error('Erreur lors de l\'application de l\'alignement:', e);
    }
  }

  /**
   * Vérifie l'état actuel de l'alignement
   */
  checkState(): boolean {
    const align = this.getCurrentAlign();
    this.currentAlign = align;
    
    // Mettre à jour l'icône pour afficher l'alignement actuel
    this.updateIcon(align);

    // Activer le bouton si l'alignement n'est pas 'left' (valeur par défaut)
    if (this.button) {
      if (align !== 'left') {
        this.button.classList.add('ce-inline-tool--active');
      } else {
        this.button.classList.remove('ce-inline-tool--active');
      }
    }

    return align !== 'left';
  }

  /**
   * Appelé lorsque l'utilisateur clique sur le bouton
   */
  surround(range: Range): void {
    const currentAlign = this.getCurrentAlign();
    const nextAlign = this.getNextAlign(currentAlign);
    this.applyAlign(nextAlign);
  }

  /**
   * Nettoie le formatage (non utilisé pour l'alignement)
   */
  clear(): void {
    // Ne rien faire pour l'alignement
  }
}


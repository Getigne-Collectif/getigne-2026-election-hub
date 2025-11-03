/**
 * EditorJS Image Carousel Tool
 * Custom block for adding image carousels to articles
 */

import { supabase } from '@/integrations/supabase/client';

interface CarouselImage {
  url: string;
  caption?: string;
}

interface CarouselData {
  images: CarouselImage[];
}

interface CarouselConfig {
  placeholder?: string;
}

interface CarouselAPI {
  blocks: {
    getBlockByIndex: (index: number) => any;
  };
  [key: string]: any;
}

interface BlockAPI {
  dispatchChange?: () => void;
  [key: string]: any;
}

export default class ImageCarouselTool {
  private api: CarouselAPI;
  private block?: BlockAPI;
  private readOnly: boolean;
  private data: CarouselData;
  private wrapper: HTMLElement | null = null;
  private config: CarouselConfig;

  static get toolbox() {
    return {
      title: 'Carousel d\'images',
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="3" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="9" r="1.5" fill="currentColor"/><circle cx="10" cy="9" r="1.5" fill="currentColor"/><circle cx="14" cy="9" r="1.5" fill="currentColor"/><path d="M4 3L8 7M16 3L12 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, api, readOnly, config, block }: {
    data?: CarouselData;
    api: CarouselAPI;
    readOnly?: boolean;
    config?: CarouselConfig;
    block?: BlockAPI;
  }) {
    this.api = api;
    this.block = block;
    this.readOnly = readOnly || false;
    this.config = config || {};
    this.data = {
      images: data?.images || []
    };
  }

  render() {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('cdx-carousel-tool');
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
    container.className = 'carousel-preview';
    container.innerHTML = `
      <div style="padding: 20px; border: 2px dashed #e5e7eb; border-radius: 8px; text-align: center; background: #f9fafb;">
        <div style="font-weight: bold; margin-bottom: 8px; color: #374151;">
          Carousel d'images (${this.data.images.length} image${this.data.images.length > 1 ? 's' : ''})
        </div>
        <div style="font-size: 14px; color: #6b7280;">
          ${this.data.images.length === 0 
            ? 'Aucune image' 
            : this.data.images.map((img, i) => `Image ${i + 1}${img.caption ? `: ${img.caption}` : ''}`).join(', ')}
        </div>
      </div>
    `;

    this.wrapper.innerHTML = '';
    this.wrapper.appendChild(container);
  }

  private renderSettings() {
    if (!this.wrapper) return;

    const container = document.createElement('div');
    container.className = 'carousel-settings';
    container.innerHTML = `
      <div style="padding: 20px; border: 2px dashed #3b82f6; border-radius: 8px; background: #eff6ff;">
        <div style="font-weight: bold; margin-bottom: 16px; color: #1e40af; display: flex; align-items: center; gap: 8px;">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="3" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="6" cy="9" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="9" r="1.5" fill="currentColor"/>
            <circle cx="14" cy="9" r="1.5" fill="currentColor"/>
          </svg>
          Carousel d'images
        </div>
        
        <div id="carousel-images-list" style="margin-bottom: 16px;">
          ${this.data.images.length === 0 
            ? '<div style="text-align: center; color: #6b7280; padding: 20px;">Aucune image ajoutée</div>'
            : this.data.images.map((img, index) => `
              <div class="carousel-image-item" draggable="true" data-index="${index}" style="margin-bottom: 8px; padding: 10px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; cursor: move; position: relative;">
                <div style="display: flex; gap: 10px; align-items: center;">
                  <div class="drag-handle" style="display: flex; align-items: center; gap: 4px; color: #9ca3af; font-size: 12px; cursor: move;">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M5 4h6v1H5V4zm0 3h6v1H5V7zm0 3h6v1H5v-1z"/>
                    </svg>
                  </div>
                  <img src="${img.url}" alt="Preview" style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px; flex-shrink: 0;">
                  <div style="flex: 1; min-width: 0;">
                    <div style="margin-bottom: 8px;">
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Légende:</div>
                      <input type="text" class="caption-input" data-index="${index}" value="${img.caption || ''}" placeholder="Légende (optionnel)" style="width: 100%; padding: 6px; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 11px;">
                    </div>
                  </div>
                  <button type="button" class="remove-image-btn" data-index="${index}" style="padding: 6px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0; z-index: 10; position: relative;" title="Supprimer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            `).join('')}
        </div>
        
        <div style="border-top: 1px solid #dbeafe; padding-top: 16px;">
          <button type="button" id="add-image-btn" style="padding: 10px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; width: 100%;">
            + Ajouter une image
          </button>
        </div>
      </div>
    `;

    this.wrapper.innerHTML = '';
    this.wrapper.appendChild(container);

    // Attach event listeners
    this.attachEventListeners(container);
  }

  private async addImage() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    fileInput.onchange = async (e) => {
      e.stopPropagation();
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) {
        document.body.removeChild(fileInput);
        return;
      }

      try {
        for (const file of Array.from(files)) {
          try {
            const imageUrl = await this.uploadImage(file);
            this.data.images.push({ url: imageUrl });
          } catch (error) {
            console.error('Error uploading image:', error);
            alert('Erreur lors du téléchargement de l\'image');
          }
        }

        this.rerender();
        // Notify EditorJS of the change
        this.block?.dispatchChange?.();
      } finally {
        // Clean up the file input
        if (fileInput.parentNode) {
          document.body.removeChild(fileInput);
        }
      }
    };

    // Prevent any form submission
    fileInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    fileInput.click();
  }

  private async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('news_images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('news_images')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  private removeImage(index: number) {
    console.log('removeImage called with index:', index);
    console.log('Images before removal:', this.data.images);
    if (index < 0 || index >= this.data.images.length) {
      console.error('Invalid index for removal:', index, 'images length:', this.data.images.length);
      return;
    }
    this.data.images.splice(index, 1);
    console.log('Images after removal:', this.data.images);
    this.rerender();
    // Notify EditorJS of the change
    this.block?.dispatchChange?.();
    console.log('Image removed and rerendered');
  }

  private rerender() {
    if (!this.wrapper) return;
    
    // Si on est en mode readOnly, on réaffiche simplement
    if (this.readOnly) {
      this.renderView();
      return;
    }
    
    // En mode édition, on met à jour juste la liste des images sans tout recréer
    const container = this.wrapper.querySelector('.carousel-settings');
    if (container) {
      const imagesList = container.querySelector('#carousel-images-list');
      if (imagesList) {
        imagesList.innerHTML = this.data.images.length === 0 
          ? '<div style="text-align: center; color: #6b7280; padding: 20px;">Aucune image ajoutée</div>'
          : this.data.images.map((img, index) => `
            <div class="carousel-image-item" draggable="true" data-index="${index}" style="margin-bottom: 8px; padding: 10px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; cursor: move; position: relative;">
              <div style="display: flex; gap: 10px; align-items: center;">
                <div class="drag-handle" style="display: flex; align-items: center; gap: 4px; color: #9ca3af; font-size: 12px; cursor: move;">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5 4h6v1H5V4zm0 3h6v1H5V7zm0 3h6v1H5v-1z"/>
                  </svg>
                </div>
                <img src="${img.url}" alt="Preview" style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px; flex-shrink: 0;">
                <div style="flex: 1; min-width: 0;">
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Légende:</div>
                    <input type="text" class="caption-input" data-index="${index}" value="${img.caption || ''}" placeholder="Légende (optionnel)" style="width: 100%; padding: 6px; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 11px;">
                  </div>
                </div>
                <button type="button" class="remove-image-btn" data-index="${index}" style="padding: 6px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0; z-index: 10; position: relative;" title="Supprimer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          `).join('');
        
        // Réattacher les event listeners
        this.attachEventListeners(container);
      }
    } else {
      // Si le container n'existe pas, on recrée tout
      this.render();
    }
  }
  
  private attachEventListeners(container: HTMLElement) {
    const addBtn = container.querySelector('#add-image-btn');
    addBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.addImage();
    });

    const removeButtons = container.querySelectorAll('.remove-image-btn');
    console.log('Found remove buttons:', removeButtons.length);
    removeButtons.forEach((btn, idx) => {
      console.log(`Attaching listener to button ${idx}:`, btn);
      
      // Disable drag on the button
      (btn as HTMLElement).setAttribute('draggable', 'false');
      
      // Stop all drag-related events on the button
      const handleMouseDown = (e: MouseEvent) => {
        console.log('Button mousedown');
        e.stopPropagation();
        e.stopImmediatePropagation();
      };
      
      const handleDragStart = (e: DragEvent) => {
        console.log('Button dragstart prevented');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      };
      
      const handleClick = (e: MouseEvent) => {
        console.log('Remove button clicked!', e);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const button = (e.currentTarget as HTMLElement);
        console.log('Button element:', button);
        const index = parseInt(button.getAttribute('data-index') || '0');
        console.log('Index to remove:', index);
        console.log('Current images:', this.data.images);
        if (index >= 0 && index < this.data.images.length) {
          console.log('Calling removeImage with index:', index);
          this.removeImage(index);
        } else {
          console.error('Invalid index:', index, 'images length:', this.data.images.length);
        }
        return false;
      };
      
      // Attach in capture phase (bubbling phase) for priority
      btn.addEventListener('mousedown', handleMouseDown, true);
      btn.addEventListener('dragstart', handleDragStart, true);
      btn.addEventListener('click', handleClick, true);
    });

    const captionInputs = container.querySelectorAll('.caption-input');
    captionInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt((e.target as HTMLInputElement).getAttribute('data-index') || '0');
        const caption = (e.target as HTMLInputElement).value.trim();
        if (this.data.images[index]) {
          this.data.images[index].caption = caption || undefined;
          // Notify EditorJS of the change
          this.block?.dispatchChange?.();
        }
      });
    });
    
    // Setup drag and drop AFTER attaching all other listeners
    // Important: ne pas cloner les éléments pour ne pas perdre les listeners
    this.setupDragAndDrop(container);
  }

  private setupDragAndDrop(container: HTMLElement) {
    const imagesList = container.querySelector('#carousel-images-list') as HTMLElement;
    if (!imagesList) return;

    let draggedElement: HTMLElement | null = null;
    let draggedIndex: number | null = null;

    const updateDragAndDrop = () => {
      const items = imagesList.querySelectorAll('.carousel-image-item');
      
      items.forEach(item => {
        const element = item as HTMLElement;
        
        // Ne PAS cloner l'élément, utiliser directement pour ne pas perdre les listeners
        // Seulement ajouter les listeners de drag si pas déjà présents
        if (element.dataset.dragSetup === 'true') {
          return; // Already setup
        }
        element.dataset.dragSetup = 'true';
        
        element.addEventListener('dragstart', (e) => {
          // Prevent drag if clicking on remove button or any button inside
          const target = e.target as HTMLElement;
          if (target.closest('.remove-image-btn') || target.closest('button') || target.tagName === 'BUTTON') {
            console.log('Drag prevented on button');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
          }
          
          console.log('Drag starting on element');
          draggedElement = element;
          draggedIndex = parseInt(element.getAttribute('data-index') || '0');
          element.style.opacity = '0.5';
          if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', element.innerHTML);
          }
        }, false); // Bubbling phase to let button handlers fire first

        element.addEventListener('dragend', (e) => {
          element.style.opacity = '1';
          draggedElement = null;
          draggedIndex = null;
        });

        element.addEventListener('dragover', (e) => {
          if (e.preventDefault) {
            e.preventDefault();
          }
          if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
          }
          
          if (draggedElement && element !== draggedElement) {
            const allItems = Array.from(imagesList.querySelectorAll('.carousel-image-item')) as HTMLElement[];
            const currentIndex = allItems.indexOf(element);
            const draggedItemIndex = allItems.indexOf(draggedElement);
            
            if (currentIndex < draggedItemIndex) {
              imagesList.insertBefore(draggedElement, element);
            } else {
              imagesList.insertBefore(draggedElement, element.nextSibling);
            }
          }
        });

        element.addEventListener('drop', (e) => {
          if (e.preventDefault) {
            e.preventDefault();
          }
          if (e.stopPropagation) {
            e.stopPropagation();
          }

          if (draggedElement && draggedIndex !== null) {
            const allItems = Array.from(imagesList.querySelectorAll('.carousel-image-item')) as HTMLElement[];
            const dropIndex = allItems.indexOf(element);
            
            if (dropIndex !== -1 && draggedIndex !== dropIndex) {
              // Reorder the array
              const draggedItem = this.data.images[draggedIndex];
              this.data.images.splice(draggedIndex, 1);
              this.data.images.splice(dropIndex, 0, draggedItem);
              
              // Re-render to update the DOM (cela supprimera les data-drag-setup, donc les listeners seront réattachés)
              this.rerender();
              
              // Notify EditorJS of the change
              this.block?.dispatchChange?.();
            }
          }

          return false;
        });
      });
    };

    updateDragAndDrop();
  }

  save(): CarouselData {
    return {
      images: this.data.images
    };
  }

  static get sanitize() {
    return {
      images: {
        url: {},
        caption: {}
      }
    };
  }
}


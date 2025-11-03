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
              <div class="carousel-image-item" style="margin-bottom: 12px; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
                <div style="display: flex; gap: 12px; align-items: start;">
                  <img src="${img.url}" alt="Preview" style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px; flex-shrink: 0;">
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">URL:</div>
                    <div style="font-size: 11px; color: #374151; word-break: break-all; margin-bottom: 8px;">${img.url}</div>
                    <div style="margin-bottom: 8px;">
                      <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Légende:</div>
                      <input type="text" class="caption-input" data-index="${index}" value="${img.caption || ''}" placeholder="Légende (optionnel)" style="width: 100%; padding: 6px; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 11px;">
                    </div>
                  </div>
                  <button type="button" class="remove-image-btn" data-index="${index}" style="padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Supprimer</button>
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
    const addBtn = container.querySelector('#add-image-btn');
    addBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.addImage();
    });

    const removeButtons = container.querySelectorAll('.remove-image-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
        this.removeImage(index);
      });
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
    this.data.images.splice(index, 1);
    this.rerender();
    // Notify EditorJS of the change
    this.block?.dispatchChange?.();
  }

  private rerender() {
    if (!this.wrapper) return;
    const parent = this.wrapper.parentElement;
    if (parent) {
      this.render();
    }
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


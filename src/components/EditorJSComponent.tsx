import React, { useEffect, useRef, memo, useState } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import Embed from '@editorjs/embed';
import Table from '@editorjs/table';
import LinkTool from '@editorjs/link';
import Marker from '@editorjs/marker';
import Delimiter from '@editorjs/delimiter';
import InlineCode from '@editorjs/inline-code';
import ImageTool from '@editorjs/image';
import Checklist from '@editorjs/checklist';
import Warning from '@editorjs/warning';
import Paragraph from '@editorjs/paragraph';
import { supabase } from '@/integrations/supabase/client';
import ImageCarouselTool from '@/components/editorjs/ImageCarouselTool';
import AcronymTool from '@/components/editorjs/AcronymTool';
import Strikethrough from 'editorjs-strikethrough';

interface EditorJSComponentProps {
  value: OutputData | string;
  onChange: (data: OutputData) => void;
  placeholder?: string;
  className?: string;
}

const EditorJSComponent: React.FC<EditorJSComponentProps> = ({
  value,
  onChange,
  placeholder = 'Commencez à écrire votre article...',
  className = ''
}) => {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const isUpdating = useRef(false);
  const lastValueRef = useRef<string>('');
  const initialValueRef = useRef<string>('');
  const isUserChangeRef = useRef(false);
  const [initialValueKey, setInitialValueKey] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  const parseValue = (val: OutputData | string): OutputData => {
    // Si c'est une chaîne vide ou null/undefined, retourner un contenu vide
    if (!val || val === '') {
      return { time: Date.now(), blocks: [], version: '2.28.0' };
    }
    
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        // Vérifier que c'est bien un format EditorJS valide
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.blocks)) {
          return parsed;
        }
        // Si ce n'est pas du JSON EditorJS valide, créer un paragraphe
        return {
          time: Date.now(),
          blocks: [{ type: 'paragraph', data: { text: val } }],
          version: '2.28.0'
        };
      } catch {
        // Ce n'est pas du JSON valide, créer un paragraphe avec le texte
        return {
          time: Date.now(),
          blocks: [{ type: 'paragraph', data: { text: val } }],
          version: '2.28.0'
        };
      }
    }
    
    // Si c'est déjà un objet OutputData, s'assurer qu'il a la bonne structure
    if (val && typeof val === 'object' && Array.isArray((val as OutputData).blocks)) {
      return val as OutputData;
    }
    
    // Fallback : contenu vide
    return { time: Date.now(), blocks: [], version: '2.28.0' };
  };

  // Calculer la clé actuelle
  const currentValueKey = typeof value === 'string' 
    ? (value ? JSON.stringify(JSON.parse(value)) : 'empty')
    : (value ? JSON.stringify(value) : 'empty');

  // Mettre à jour la valeur initiale seulement lors d'un changement externe
  // On utilise un flag pour distinguer les modifications utilisateur des changements externes
  useEffect(() => {
    // Si c'est la première fois, stocker la valeur initiale
    if (!initialValueKey) {
      initialValueRef.current = currentValueKey;
      setInitialValueKey(currentValueKey);
      lastValueRef.current = currentValueKey;
      return;
    }
    
    // Si c'est une modification utilisateur, ne pas recréer l'éditeur
    if (isUserChangeRef.current) {
      isUserChangeRef.current = false;
      return;
    }
    
    // Si le contenu a changé de manière externe
    // (la valeur actuelle ne correspond pas à la dernière valeur sauvegardée)
    // Cela signifie que le contenu vient d'être chargé depuis l'extérieur
    if (currentValueKey !== lastValueRef.current && currentValueKey !== initialValueRef.current) {
      initialValueRef.current = currentValueKey;
      setInitialValueKey(currentValueKey);
      lastValueRef.current = currentValueKey;
    }
  }, [currentValueKey, initialValueKey]);

  useEffect(() => {
    if (!holderRef.current) return;

    // Nettoyer d'abord toute instance existante
    if (editorRef.current) {
      try {
        if (typeof (editorRef.current as any).destroy === 'function') {
          (editorRef.current as any).destroy();
        }
      } catch (error) {
        console.error('Error destroying existing editor:', error);
      }
      editorRef.current = null;
      setIsReady(false);
    }

    // Vider le conteneur
    if (holderRef.current) {
      holderRef.current.innerHTML = '';
    }

    const initialData = parseValue(value);
    setIsReady(false);
    lastValueRef.current = typeof value === 'string' ? value : (value ? JSON.stringify(value) : '');

    const editor = new EditorJS({
      holder: holderRef.current,
      placeholder,
      data: initialData,
      inlineToolbar: ['bold', 'italic', 'link', 'marker', 'acronym', 'strikethrough'],
      tools: {
        header: {
          class: Header,
          config: {
            placeholder: 'Entrez un titre',
            levels: [1, 2, 3, 4, 5, 6],
            defaultLevel: 2
          }
        },
        paragraph: {
          class: Paragraph,
          inlineToolbar: true
        },
        list: {
          class: List,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered'
          }
        },
        checklist: {
          class: Checklist,
          inlineToolbar: true
        },
        quote: {
          class: Quote,
          inlineToolbar: true,
          config: {
            quotePlaceholder: 'Entrez une citation',
            captionPlaceholder: 'Auteur de la citation'
          }
        },
        warning: {
          class: Warning,
          inlineToolbar: true,
          config: {
            titlePlaceholder: 'Titre',
            messagePlaceholder: 'Message'
          }
        },
        marker: {
          class: Marker
        },
        acronym: {
          class: AcronymTool
        },
        strikethrough: {
          class: Strikethrough
        },
        code: {
          class: Code,
          config: {
            placeholder: 'Entrez votre code'
          }
        },
        delimiter: Delimiter,
        inlineCode: {
          class: InlineCode
        },
        linkTool: {
          class: LinkTool,
          config: {
            endpoint: '/api/fetchUrl'
          }
        },
        image: {
          class: ImageTool,
          config: {
            uploader: {
              async uploadByFile(file: File) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                // Utiliser un sous-dossier basé sur le contexte (par défaut 'general', 'program_points' pour les points du programme)
                const subFolder = (window.location.pathname.includes('/admin/program') || window.location.pathname.includes('/programme')) 
                  ? 'program_points' 
                  : 'news_content';
                const filePath = `${subFolder}/${fileName}`;

                try {
                  const { error: uploadError } = await supabase.storage
                    .from('news_images')
                    .upload(filePath, file);

                  if (uploadError) throw uploadError;

                  const { data: { publicUrl } } = supabase.storage
                    .from('news_images')
                    .getPublicUrl(filePath);

                  return {
                    success: 1,
                    file: {
                      url: publicUrl
                    }
                  };
                } catch (error) {
                  console.error('Error uploading image:', error);
                  return {
                    success: 0
                  };
                }
              }
            }
          }
        },
        embed: {
          class: Embed,
          config: {
            services: {
              youtube: true,
              vimeo: true,
              twitter: true,
              instagram: true,
              facebook: true
            }
          }
        },
        table: {
          class: Table,
          inlineToolbar: true,
          config: {
            rows: 2,
            cols: 3
          }
        },
        imageCarousel: {
          class: ImageCarouselTool,
          config: {
            placeholder: 'Ajouter un carousel d\'images'
          }
        }
      },
      onChange: async () => {
        if (editorRef.current && !isUpdating.current) {
          const data = await editorRef.current.save();
          const dataString = JSON.stringify(data);
          // Marquer que c'est une modification utilisateur
          isUserChangeRef.current = true;
          lastValueRef.current = dataString;
          onChange(data);
        }
      },
      onReady: () => {
        setIsReady(true);
      }
    } as any);

    editorRef.current = editor;

    return () => {
      if (editorRef.current) {
        try {
          if (typeof (editorRef.current as any).destroy === 'function') {
            (editorRef.current as any).destroy();
          }
        } catch (error) {
          console.error('Error destroying editor:', error);
        }
        editorRef.current = null;
        setIsReady(false);
      }
      if (holderRef.current) {
        holderRef.current.innerHTML = '';
      }
    };
  }, [initialValueKey]); // Dépendre de la clé initiale pour recréer seulement lors d'un changement externe


  return (
    <div className={`editorjs-container ${className}`}>
      <div ref={holderRef} />
      <style>{`
        .editorjs-container {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          min-height: 400px;
          max-height: 60vh;
          overflow-y: auto;
          background: white;
        }

        .ce-block__content,
        .ce-toolbar__content {
          max-width: 100%;
        }

        .codex-editor__redactor {
          padding-bottom: 0 !important;
        }

        .ce-block {
          margin-bottom: 1rem;
        }

        .ce-paragraph {
          line-height: 1.6;
        }

        .ce-header {
          font-weight: bold;
          margin: 1.5rem 0 1rem;
        }

        .ce-quote {
          border-left: 4px solid #10b981;
          padding-left: 1rem;
          font-style: italic;
        }

        .ce-delimiter {
          margin: 2rem 0;
          text-align: center;
        }

        .ce-warning {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 1rem;
          border-radius: 0.25rem;
        }

        .cdx-checklist__item-checkbox {
          margin-right: 0.5rem;
        }

        .ce-code__textarea {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.375rem;
          font-family: 'Courier New', monospace;
        }

        .tc-wrap {
          --color-border: #e5e7eb;
          --color-background: #f9fafb;
        }

        .tc-table {
          border-collapse: collapse;
          width: 100%;
        }

        .tc-table__cell {
          border: 1px solid var(--color-border);
          padding: 0.5rem;
        }

        .image-tool__image {
          border-radius: 0.5rem;
          overflow: hidden;
          margin: 1rem 0;
        }

        .embed-tool {
          margin: 1.5rem 0;
        }

        /* Style pour les acronymes */
        span.acronym {
          text-decoration: underline dotted;
          text-decoration-color: #10b981;
          cursor: help;
          background-color: rgba(16, 185, 129, 0.1);
          padding: 0 2px;
          border-radius: 2px;
        }

        /* Ajuster la taille des icônes inline personnalisées */
        .ce-inline-tool.strikethrough-tool svg,
        .ce-inline-tool.acronym-tool svg,
        .ce-inline-tool[title="Barrer le texte"] svg,
        .ce-inline-tool[title="Marquer dans le lexique"] svg {
          width: 13px !important;
          height: 13px !important;
          max-width: 13px !important;
          max-height: 13px !important;
          min-width: 13px !important;
          min-height: 13px !important;
        }

        /* Réduire l'épaisseur de l'icône strikethrough - cibler tous les SVG avec stroke-width > 1.5 */
        .ce-inline-tool svg[stroke-width="2"] path,
        .ce-inline-tool svg[stroke-width="2"] line,
        .ce-inline-tool svg path[stroke-width="2"],
        .ce-inline-tool svg line[stroke-width="2"],
        .ce-inline-tool svg[style*="stroke-width: 2"] path,
        .ce-inline-tool svg[style*="stroke-width: 2"] line {
          stroke-width: 1.5 !important;
        }

        /* S'assurer que le bouton lui-même n'impose pas de taille */
        .ce-inline-tool.strikethrough-tool,
        .ce-inline-tool.acronym-tool,
        .ce-inline-tool[title="Barrer le texte"],
        .ce-inline-tool[title="Marquer dans le lexique"] {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default EditorJSComponent;


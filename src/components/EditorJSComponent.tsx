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
  const [isReady, setIsReady] = useState(false);

  const parseValue = (val: OutputData | string): OutputData => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return {
          time: Date.now(),
          blocks: val ? [{ type: 'paragraph', data: { text: val } }] : [],
          version: '2.28.0'
        };
      }
    }
    return val || { time: Date.now(), blocks: [], version: '2.28.0' };
  };

  useEffect(() => {
    if (!holderRef.current) return;

    const initialData = parseValue(value);

    setIsReady(false);

    const editor = new EditorJS({
      holder: holderRef.current,
      placeholder,
      data: initialData,
      inlineToolbar: ['bold', 'italic', 'link', 'marker', 'acronym'],
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
          lastValueRef.current = JSON.stringify(data);
          onChange(data);
        }
      },
      onReady: () => {
        setIsReady(true);
      }
    } as any);

    editorRef.current = editor;

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        try {
          editorRef.current.destroy();
        } catch (error) {
          console.error('Error destroying editor:', error);
        }
        editorRef.current = null;
        setIsReady(false);
      }
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current || !isReady) return;

    const valueString = typeof value === 'string' ? value : JSON.stringify(value);

    if (valueString && valueString !== lastValueRef.current && valueString !== '{}') {
      const newData = parseValue(value);

      if (newData.blocks && newData.blocks.length > 0) {
        const applyValue = async () => {
          if (!editorRef.current) return;

          isUpdating.current = true;
          try {
            await editorRef.current.clear();
            await editorRef.current.render(newData);
            lastValueRef.current = valueString;
          } catch (error) {
            console.error('Error rendering editor data:', error);
          } finally {
            isUpdating.current = false;
          }
        };

        applyValue();
      }
    }
  }, [value, isReady]);

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
      `}</style>
    </div>
  );
};

export default EditorJSComponent;


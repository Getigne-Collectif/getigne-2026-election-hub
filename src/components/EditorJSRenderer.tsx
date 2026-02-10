import React, { useEffect, useState } from 'react';
import { OutputData, OutputBlockData } from '@editorjs/editorjs';
import ImageCarousel from '@/components/ImageCarousel';
import AcronymTooltip from '@/components/AcronymTooltip';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { ChevronRight } from 'lucide-react';

interface EditorJSRendererProps {
  data: OutputData | string;
  className?: string;
}

interface LexiconEntry {
  id: string;
  name: string;
  acronym: string | null;
  content: any;
  external_link: string | null;
  logo_url: string | null;
}

const EditorJSRenderer: React.FC<EditorJSRendererProps> = ({ data, className = '' }) => {
  const [lexiconEntries, setLexiconEntries] = useState<Record<string, LexiconEntry>>({});
  
  let parsedData: OutputData;

  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      return <div className={className}>{data}</div>;
    }
  } else {
    parsedData = data;
  }

  if (!parsedData.blocks || !Array.isArray(parsedData.blocks)) {
    return null;
  }

  // Charger les entrées du lexique
  useEffect(() => {
    const loadLexiconEntries = async () => {
      try {
        const { data, error } = await supabase
          .from('lexicon_entries')
          .select('*');

        if (error) {
          console.error('Erreur lors du chargement du lexique:', error);
          return;
        }

        if (data) {
          const entriesMap = data.reduce((acc, entry) => {
            acc[entry.id] = entry;
            return acc;
          }, {} as Record<string, LexiconEntry>);
          setLexiconEntries(entriesMap);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du lexique:', error);
      }
    };

    loadLexiconEntries();
  }, []);

  // Fonction pour parser le HTML et remplacer les acronymes par des tooltips
  const parseAcronyms = React.useCallback((html: string): React.ReactNode => {
    if (!html) return null;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const acronymSpans = doc.querySelectorAll('span.acronym[data-lexicon-id]');

    // Si pas d'acronymes, retourner le HTML tel quel
    if (acronymSpans.length === 0) {
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    }

    // Fonction récursive pour parcourir les nœuds et construire les éléments React
    let nodeIndex = 0;
    
    const processNode = (node: Node): React.ReactNode => {
      // Si c'est un nœud texte
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      
      // Si c'est un élément
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        
        // Si c'est un span avec la classe acronym
        if (element.tagName === 'SPAN' && element.classList.contains('acronym')) {
          const lexiconId = element.getAttribute('data-lexicon-id');
          const text = element.textContent || '';
          const entry = lexiconId && lexiconEntries[lexiconId] ? lexiconEntries[lexiconId] : null;
          
          if (entry) {
            return (
              <AcronymTooltip key={`acronym-${nodeIndex++}`} entry={entry}>
                {text}
              </AcronymTooltip>
            );
          } else {
            return (
              <span 
                key={`acronym-${nodeIndex++}`}
                style={{
                  textDecoration: 'underline dotted',
                  textDecorationColor: '#10b981',
                  cursor: 'help',
                }}
              >
                {text}
              </span>
            );
          }
        }
        
        // Si c'est une balise de texte barré (s ou del)
        if (element.tagName === 'S' || element.tagName === 'DEL') {
          const children: React.ReactNode[] = [];
          element.childNodes.forEach((child) => {
            children.push(processNode(child));
          });
          return (
            <s key={`strikethrough-${nodeIndex++}`} className="line-through">
              {children}
            </s>
          );
        }
        
        // Pour les autres éléments HTML (b, i, em, strong, etc.)
        const children: React.ReactNode[] = [];
        element.childNodes.forEach((child) => {
          children.push(processNode(child));
        });
        
        // Recréer l'élément avec ses enfants
        const tagName = element.tagName.toLowerCase();
        const props: any = { key: `elem-${nodeIndex++}` };
        
        // Copier les attributs importants
        if (element.className) {
          props.className = element.className;
        }
        if (element.style.cssText) {
          props.style = element.style.cssText;
        }
        
        return React.createElement(tagName, props, ...children);
      }
      
      return null;
    };
    
    // Traiter tous les enfants du body
    const result: React.ReactNode[] = [];
    doc.body.childNodes.forEach((child) => {
      result.push(processNode(child));
    });
    
    return <>{result}</>;
  }, [lexiconEntries]);

  const renderBlock = (block: OutputBlockData, index: number) => {
    switch (block.type) {
      case 'header':
        const HeaderTag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
        const headerClasses: Record<number, string> = {
          1: 'text-4xl font-bold mb-6 mt-8',
          2: 'text-3xl font-bold mb-5 mt-7',
          3: 'text-2xl font-bold mb-4 mt-6',
          4: 'text-xl font-bold mb-3 mt-5',
          5: 'text-lg font-bold mb-2 mt-4',
          6: 'text-base font-bold mb-2 mt-3'
        };
        const headerStyle: React.CSSProperties = {};
        if (block.data.textAlign && ['left', 'center', 'right', 'justify'].includes(block.data.textAlign)) {
          headerStyle.textAlign = block.data.textAlign as 'left' | 'center' | 'right' | 'justify';
        }
        if (block.data.textSize && ['small', 'normal', 'large', 'x-large', 'xx-large'].includes(block.data.textSize)) {
          const sizeMap: Record<string, string> = {
            'small': '0.875rem',
            'normal': '1rem',
            'large': '1.25rem',
            'x-large': '1.5rem',
            'xx-large': '2rem'
          };
          headerStyle.fontSize = sizeMap[block.data.textSize];
        }
        return (
          <HeaderTag 
            key={index} 
            className={headerClasses[block.data.level as number] || headerClasses[2]}
            style={headerStyle}
          >
            {parseAcronyms(block.data.text)}
          </HeaderTag>
        );

      case 'paragraph':
        const paragraphStyle: React.CSSProperties = {};
        if (block.data.textAlign && ['left', 'center', 'right', 'justify'].includes(block.data.textAlign)) {
          paragraphStyle.textAlign = block.data.textAlign as 'left' | 'center' | 'right' | 'justify';
        }
        if (block.data.textSize && ['small', 'normal', 'large', 'x-large', 'xx-large'].includes(block.data.textSize)) {
          const sizeMap: Record<string, string> = {
            'small': '0.875rem',
            'normal': '1rem',
            'large': '1.25rem',
            'x-large': '1.5rem',
            'xx-large': '2rem'
          };
          paragraphStyle.fontSize = sizeMap[block.data.textSize];
        }
        return (
          <p 
            key={index} 
            className="mb-4 leading-relaxed text-gray-700"
            style={paragraphStyle}
          >
            {parseAcronyms(block.data.text)}
          </p>
        );

      case 'list':
        const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
        const listClass = block.data.style === 'ordered' 
          ? 'list-decimal list-inside mb-4 space-y-2' 
          : 'list-disc list-inside mb-4 space-y-2';
        return (
          <ListTag key={index} className={listClass}>
            {block.data.items.map((item: string | { content: string; meta: any; items: any[] }, i: number) => {
              const content = typeof item === 'string' ? item : item.content;
              return (
                <li key={i} className="text-gray-700">
                  {parseAcronyms(content)}
                </li>
              );
            })}
          </ListTag>
        );

      case 'checklist':
        return (
          <div key={index} className="mb-4 space-y-2">
            {block.data.items.map((item: { text: string; checked: boolean }, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={item.checked}
                  readOnly
                  className="mt-1 cursor-default"
                />
                <span 
                  className={`text-gray-700 ${item.checked ? 'line-through text-gray-500' : ''}`}
                >
                  {parseAcronyms(item.text)}
                </span>
              </div>
            ))}
          </div>
        );

      case 'quote':
        return (
          <blockquote key={index} className="border-l-4 border-brand pl-4 py-2 mb-4 italic bg-gray-50">
            <p className="text-gray-700 mb-2">
              {parseAcronyms(block.data.text)}
            </p>
            {block.data.caption && (
              <cite className="text-sm text-gray-600 not-italic">— {parseAcronyms(block.data.caption)}</cite>
            )}
          </blockquote>
        );

      case 'warning':
        return (
          <div key={index} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4 rounded">
            {block.data.title && (
              <h4 className="font-bold text-yellow-800 mb-2">{parseAcronyms(block.data.title)}</h4>
            )}
            <p className="text-yellow-700">{parseAcronyms(block.data.message)}</p>
          </div>
        );

      case 'code':
        return (
          <pre key={index} className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
            <code>{block.data.code}</code>
          </pre>
        );

      case 'delimiter':
        return (
          <div key={index} className="text-center my-8">
            <span className="text-2xl text-gray-400">* * *</span>
          </div>
        );

      case 'image':
        return (
          <figure key={index} className="mb-6">
            <img
              src={block.data.file.url}
              alt={block.data.caption || ''}
              className="w-full rounded-lg"
            />
            {block.data.caption && (
              <figcaption className="text-center text-sm text-gray-600 mt-2">
                {parseAcronyms(block.data.caption)}
              </figcaption>
            )}
          </figure>
        );

      case 'embed':
        return (
          <div key={index} className="mb-6">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={block.data.embed}
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                frameBorder="0"
                allowFullScreen
                title={block.data.caption || 'Embedded content'}
              />
            </div>
            {block.data.caption && (
              <p className="text-center text-sm text-gray-600 mt-2">{parseAcronyms(block.data.caption)}</p>
            )}
          </div>
        );

      case 'table':
        return (
          <div key={index} className="mb-6 overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <tbody>
                {block.data.content.map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.map((cell: string, cellIndex: number) => (
                      <td 
                        key={cellIndex} 
                        className="border border-gray-300 px-4 py-2"
                      >
                        {parseAcronyms(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'linkTool':
        return (
          <a
            key={index}
            href={block.data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-4">
              {block.data.meta?.image?.url && (
                <img
                  src={block.data.meta.image.url}
                  alt=""
                  className="w-24 h-24 object-cover rounded"
                />
              )}
              <div>
                <h4 className="font-bold text-brand hover:underline">
                  {parseAcronyms(block.data.meta?.title || block.data.link)}
                </h4>
                {block.data.meta?.description && (
                  <p className="text-sm text-gray-600 mt-1">{parseAcronyms(block.data.meta.description)}</p>
                )}
              </div>
            </div>
          </a>
        );

      case 'imageCarousel':
        return (
          <ImageCarousel
            key={index}
            images={block.data.images || []}
          />
        );

      case 'programLink':
        return (
          <ProgramLinkCard
            key={index}
            targetType={block.data.targetType}
            targetId={block.data.targetId}
            cachedTitle={block.data.title}
            slug={block.data.slug}
          />
        );

      default:
        console.warn(`Unknown block type: ${block.type}`);
        return null;
    }
  };

  return (
    <div className={`rich-content ${className}`}>
      {parsedData.blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
};

interface ProgramLinkCardProps {
  targetType: 'program_point' | 'flagship' | 'event' | 'article' | 'page';
  targetId: string;
  cachedTitle?: string;
  slug?: string;
}

const ProgramLinkCard: React.FC<ProgramLinkCardProps> = ({ targetType, targetId, cachedTitle, slug }) => {
  const [title, setTitle] = useState<string>(cachedTitle || '');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [icon, setIcon] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedTitle);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        if (targetType === 'program_point') {
          const { data, error } = await supabase
            .from('program_points')
            .select('title, program_items(icon)')
            .eq('id', targetId)
            .single();

          if (error) throw error;
          if (data) {
            setTitle(data.title);
            // Récupérer l'icône de la section associée
            // program_items peut être un objet ou un tableau selon la relation
            const programItem = Array.isArray(data.program_items) 
              ? data.program_items[0] 
              : (data.program_items as any);
            if (programItem?.icon) {
              setIcon(programItem.icon);
            }
          }
        } else if (targetType === 'flagship') {
          const { data, error } = await supabase
            .from('program_flagship_projects')
            .select('title, image_url')
            .eq('id', targetId)
            .single();

          if (error) throw error;
          if (data) {
            setTitle(data.title);
            if (data.image_url) {
              setImageUrl(data.image_url);
            }
          }
        } else if (targetType === 'event') {
          const { data, error } = await supabase
            .from('events')
            .select('title, image')
            .eq('id', targetId)
            .single();

          if (error) throw error;
          if (data) {
            setTitle(data.title);
            if (data.image) {
              setImageUrl(data.image);
            }
          }
        } else if (targetType === 'article') {
          const { data, error } = await supabase
            .from('news')
            .select('title, image')
            .eq('id', targetId)
            .single();

          if (error) throw error;
          if (data) {
            setTitle(data.title);
            if (data.image) {
              setImageUrl(data.image);
            }
          }
        } else if (targetType === 'page') {
          // Pour les pages statiques, utiliser le titre depuis le slug
          const pageTitles: Record<string, string> = {
            'programme': 'Programme',
            'contact': 'Contact',
            'agenda': 'Agenda',
            'news': 'Actualités'
          };
          setTitle(pageTitles[slug || targetId] || 'Page');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setTitle('Point de programme');
      } finally {
        setIsLoading(false);
      }
    };

    if (cachedTitle) {
      setTitle(cachedTitle);
      // Charger quand même les données supplémentaires (image/icône) sauf pour les pages
      if (targetType !== 'page') {
        loadData();
      } else {
        setIsLoading(false);
      }
    } else {
      loadData();
    }
  }, [targetType, targetId, cachedTitle, slug]);

  const handleNavigate = () => {
    if (targetType === 'program_point' || targetType === 'flagship') {
      const anchorId = targetType === 'program_point' 
        ? `program-point-${targetId}`
        : `flagship-${targetId}`;

      if (window.location.pathname === '/programme') {
        // On est déjà sur la page programme, scroller
        const element = document.getElementById(anchorId);
        if (element) {
          // Mettre à jour l'URL avec le hash d'abord
          window.history.pushState(null, '', `#${anchorId}`);
          
          // Calculer la position avec un offset de 80px vers le haut
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - 120;
          
          // Scroller vers la position calculée
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          
          // Si c'est un point de programme, déclencher l'ouverture après le scroll
          if (targetType === 'program_point') {
            setTimeout(() => {
              // Trouver le bouton d'expansion dans la card et le cliquer
              const header = element.querySelector('[class*="cursor-pointer"]') as HTMLElement;
              if (header && !header.closest('.ce-block')) {
                // Vérifier si le contenu n'est pas déjà ouvert
                const contentDiv = element.querySelector('[class*="grid"]') as HTMLElement;
                if (contentDiv && !contentDiv.classList.contains('grid-rows-[1fr]')) {
                  header.click();
                }
              }
            }, 600);
          }
        }
      } else {
        // Naviguer vers la page programme avec l'ancre
        window.location.href = `/programme#${anchorId}`;
      }
    } else if (targetType === 'event') {
      // Naviguer vers la page de l'événement
      const eventPath = slug ? `/agenda/${slug}` : `/agenda/${targetId}`;
      window.location.href = eventPath;
    } else if (targetType === 'article') {
      // Naviguer vers la page de l'article
      const articlePath = slug ? `/news/${slug}` : `/news/${targetId}`;
      window.location.href = articlePath;
    } else if (targetType === 'page') {
      // Naviguer vers la page statique
      const pagePath = `/${slug || targetId}`;
      window.location.href = pagePath;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-brand/10 to-brand-gradient-end/10 border-2 border-brand/20 rounded-xl mb-4">
        <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
        <Button size="sm" disabled className="flex-shrink-0">
          Chargement...
        </Button>
      </div>
    );
  }

  return (
    <div 
      onClick={handleNavigate}
      className="flex items-center gap-4 p-4 bg-gradient-to-r from-brand/10 via-brand-darker/10 to-brand/10 border-2 border-brand/30 rounded-xl mb-4 hover:border-brand/50 hover:shadow-lg transition-all group cursor-pointer"
    >
      {/* Image ou icône */}
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-brand to-brand-gradient-end flex items-center justify-center shadow-md">
        {(targetType === 'flagship' || targetType === 'event' || targetType === 'article') && imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Si l'image ne charge pas, afficher l'icône par défaut
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : icon ? (
          <DynamicIcon name={icon} className="w-8 h-8 text-white" />
        ) : targetType === 'page' ? (
          <ChevronRight className="w-8 h-8 text-white" />
        ) : (
          <span className="text-white text-2xl font-bold">
            {targetType === 'program_point' ? '📋' : targetType === 'flagship' ? '⭐' : targetType === 'event' ? '📅' : '📰'}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-brand uppercase mb-1 tracking-wide">
          Voir aussi
        </div>
        <div className="font-bold text-gray-900 text-base leading-tight group-hover:text-brand transition-colors">
          {title || 'Point de programme'}
        </div>
      </div>

      {/* Bouton */}
      <Button
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleNavigate();
        }}
        className="flex-shrink-0 bg-gradient-to-r from-brand to-brand-gradient-end text-white hover:from-brand/90 hover:to-brand-gradient-end/90 shadow-md hover:shadow-lg transition-all whitespace-nowrap"
      >
        Voir →
      </Button>
    </div>
  );
};

export default EditorJSRenderer;




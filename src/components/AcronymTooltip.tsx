import React from 'react';
import ReactDOM from 'react-dom';
import { OutputData } from '@editorjs/editorjs';
import EditorJSRenderer from './EditorJSRenderer';
import { ExternalLink } from 'lucide-react';

interface LexiconEntry {
  id: string;
  name: string;
  acronym: string | null;
  content: OutputData | null;
  external_link: string | null;
  logo_url: string | null;
}

interface AcronymTooltipProps {
  entry: LexiconEntry;
  children: React.ReactNode;
}

/**
 * Composant qui affiche une tooltip enrichie pour un acronyme
 * au survol d'un terme marqué
 */
const AcronymTooltip: React.FC<AcronymTooltipProps> = ({ entry, children }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLSpanElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  // Calculer la position après le rendu de la tooltip
  React.useLayoutEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      // Positionner la tooltip en dessous de l'élément
      let top = rect.bottom + window.scrollY + 8;
      let left = rect.left + window.scrollX;

      // Vérifier si la tooltip dépasse à droite de l'écran
      if (left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width - 16;
      }

      // Vérifier si la tooltip dépasse en bas de l'écran
      if (top + tooltipRect.height > window.innerHeight + window.scrollY) {
        // Afficher au-dessus à la place
        top = rect.top + window.scrollY - tooltipRect.height - 8;
      }

      setPosition({ top, left });
    }
  }, [isVisible]);

  const tooltipContent = isVisible && (
        <div
          ref={tooltipRef}
          className="acronym-tooltip"
          style={{
            position: 'absolute',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 9999,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            padding: '16px',
            maxWidth: '400px',
            minWidth: '300px',
          }}
          role="tooltip"
          aria-label={`Définition de ${entry.acronym || entry.name}`}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex gap-3">
            {entry.logo_url && (
              <div className="flex-shrink-0">
                <img
                  src={entry.logo_url}
                  alt={`Logo ${entry.name}`}
                  className="w-12 h-12 object-contain rounded"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <h4 className="font-bold text-gray-900 text-base mb-1">
                  {entry.name}
                </h4>
                {entry.acronym && (
                  <div className="text-sm text-gray-600 font-medium">
                    {entry.acronym}
                  </div>
                )}
              </div>

              {entry.content && (
                <div className="text-sm text-gray-700 mb-3">
                  <EditorJSRenderer 
                    data={entry.content} 
                    className="tooltip-content"
                  />
                </div>
              )}

              {entry.external_link && (
                <a
                  href={entry.external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-getigne-accent hover:text-getigne-accent-dark transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>En savoir plus</span>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>

          <style>{`
            .tooltip-content .rich-content {
              font-size: 14px;
            }
            
            .tooltip-content .rich-content p {
              margin-bottom: 8px;
              line-height: 1.5;
            }
            
            .tooltip-content .rich-content h1,
            .tooltip-content .rich-content h2,
            .tooltip-content .rich-content h3,
            .tooltip-content .rich-content h4,
            .tooltip-content .rich-content h5,
            .tooltip-content .rich-content h6 {
              margin-top: 8px;
              margin-bottom: 4px;
              font-size: 14px;
              font-weight: 600;
            }
            
            .tooltip-content .rich-content ul,
            .tooltip-content .rich-content ol {
              margin-bottom: 8px;
              padding-left: 20px;
            }
            
            .tooltip-content .rich-content li {
              margin-bottom: 4px;
            }
          `}</style>
        </div>
  );

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="acronym-trigger"
        style={{
          textDecoration: 'underline dotted',
          textDecorationColor: '#10b981',
          cursor: 'help',
        }}
      >
        {children}
      </span>

      {tooltipContent && ReactDOM.createPortal(tooltipContent, document.body)}
    </>
  );
};

export default AcronymTooltip;


import React from 'react';
import type { Tables } from '@/integrations/supabase/types';
import type { ProgramPoint, ProgramCompetentEntity, ProgramFlagshipProject } from '@/types/program.types';
import { editorjsToHTML } from '@/utils/editorjsToHTML';
import { DynamicIcon } from '@/components/ui/dynamic-icon';

interface ProgramPDFContentProps {
  programGeneral: Tables<'program_general'> | null;
  flagshipProjects: ProgramFlagshipProject[];
  programItems: Array<Tables<'program_items'> & { program_points: ProgramPoint[] }>;
}

const ProgramPDFContent: React.FC<ProgramPDFContentProps> = ({
  programGeneral,
  flagshipProjects,
  programItems,
}) => {
  return (
    <div
      id="program-pdf-content"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1f2937',
        lineHeight: '1.6',
      }}
    >
      {/* En-tête avec logo/titre */}
      <div
        style={{
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '3px solid #10b981',
        }}
      >
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#065f46',
            marginBottom: '10px',
          }}
        >
          Programme - Objectif 2026
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Gétigné Collectif - Généré le {new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Présentation générale */}
      {programGeneral && (
        <section
          style={{
            marginBottom: '40px',
            padding: '20px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            borderRadius: '8px',
            color: '#ffffff',
          }}
        >
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '15px',
            }}
          >
            Un programme ambitieux, réfléchi et participatif
          </h2>
          <div
            dangerouslySetInnerHTML={{
              __html: editorjsToHTML(programGeneral.content || ''),
            }}
            style={{
              color: '#ffffff',
            }}
          />
        </section>
      )}

      {/* Projets phares */}
      {flagshipProjects && flagshipProjects.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h2
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: '#065f46',
              paddingBottom: '10px',
              borderBottom: '2px solid #10b981',
            }}
          >
            Trois projets phares pour l'avenir
          </h2>
          {flagshipProjects.map((project, index) => (
            <div
              key={project.id}
              style={{
                marginBottom: '30px',
                padding: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#f9fafb',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3
                  style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: '#065f46',
                    margin: 0,
                  }}
                >
                  {project.title}
                </h3>
              </div>

              {project.image_url && (
                <div style={{ marginBottom: '15px' }}>
                  <img
                    src={project.image_url}
                    alt={project.title}
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              )}

              {project.effects && project.effects.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                  {project.effects.map((effect) => (
                    <span
                      key={effect.id}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        backgroundColor: '#e5e7eb',
                        color: '#374151',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      {effect.icon && (
                        <span style={{ marginRight: '5px' }}>{effect.name}</span>
                      )}
                      {!effect.icon && effect.name}
                    </span>
                  ))}
                </div>
              )}

              {project.description && (
                <div
                  dangerouslySetInnerHTML={{
                    __html: editorjsToHTML(project.description),
                  }}
                  style={{ marginBottom: '15px' }}
                />
              )}

              {project.timeline && project.timeline.length > 0 && (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      marginBottom: '15px',
                      color: '#065f46',
                    }}
                  >
                    {project.timeline_horizon || 'Calendrier'}
                  </h4>
                  {project.timeline.map((event, idx) => (
                    <div
                      key={event.id}
                      style={{
                        display: 'flex',
                        gap: '15px',
                        marginBottom: '15px',
                        paddingBottom: '15px',
                        borderBottom: idx < project.timeline.length - 1 ? '1px solid #e5e7eb' : 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            marginBottom: '5px',
                          }}
                        >
                          {event.date_text}
                        </div>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1f2937',
                          }}
                        >
                          {event.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Sections avec points */}
      <section style={{ marginBottom: '40px' }}>
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#065f46',
            paddingBottom: '10px',
            borderBottom: '2px solid #10b981',
          }}
        >
          Nos mesures pour Gétigné
        </h2>

        {programItems.map((item) => {
          const validatedPoints = item.program_points.filter(
            (point) => {
              const status = point.status;
              // Inclure les points validés, pending, to_discuss, ou sans statut (null/undefined)
              // Exclure seulement les drafts
              return !status || status === 'validated' || status === 'pending' || status === 'to_discuss';
            }
          );

          return (
            <div
              key={item.id}
              style={{
                marginBottom: '40px',
                padding: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                pageBreakInside: 'avoid',
              }}
            >
              {/* Image de section si présente */}
              {item.image && (
                <div style={{ marginBottom: '20px' }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{
                      width: '100%',
                      maxHeight: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              )}

              {/* En-tête de section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <DynamicIcon name={item.icon} size={24} />
                </div>
                <h3
                  style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: '#065f46',
                    margin: 0,
                  }}
                >
                  {item.title}
                </h3>
              </div>

              {/* Description de la section */}
              {item.description && (
                <div
                  dangerouslySetInnerHTML={{
                    __html: editorjsToHTML(item.description),
                  }}
                  style={{ marginBottom: '20px', color: '#374151' }}
                />
              )}

              {/* Contenu HTML de la section */}
              {item.content && (
                <div
                  dangerouslySetInnerHTML={{ __html: item.content }}
                  style={{ marginBottom: '20px', color: '#374151' }}
                />
              )}

              {/* Points du programme */}
              {validatedPoints.length > 0 && (
                <div style={{ marginTop: '25px' }}>
                  <h4
                    style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      marginBottom: '15px',
                      color: '#065f46',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                      }}
                    >
                      ✓
                    </span>
                    Points du programme
                  </h4>

                  {validatedPoints.map((point) => (
                    <div
                      key={point.id}
                      style={{
                        marginBottom: '20px',
                        padding: '15px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        backgroundColor: '#f9fafb',
                        pageBreakInside: 'avoid',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                        {point.competent_entity && (
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              border: '1px solid #e5e7eb',
                              backgroundColor: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              overflow: 'hidden',
                            }}
                          >
                            {point.competent_entity.logo_url ? (
                              <img
                                src={point.competent_entity.logo_url}
                                alt={point.competent_entity.name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  color: '#10b981',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {point.competent_entity.name.slice(0, 2)}
                              </span>
                            )}
                          </div>
                        )}
                        <h5
                          style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#1f2937',
                            margin: 0,
                            flex: 1,
                          }}
                        >
                          {point.title}
                        </h5>
                      </div>

                      {/* Contenu du point */}
                      {point.content && (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: editorjsToHTML(point.content),
                          }}
                          style={{ 
                            color: '#374151', 
                            marginTop: '10px',
                            marginBottom: '10px',
                            lineHeight: '1.6',
                          }}
                        />
                      )}

                      {/* Fichiers attachés */}
                      {point.files_metadata && point.files_metadata.length > 0 && (
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              marginBottom: '8px',
                            }}
                          >
                            Fichiers attachés
                          </div>
                          {point.files_metadata.map((fileMeta, idx) => (
                            <div
                              key={idx}
                              style={{
                                fontSize: '12px',
                                color: '#6b7280',
                                marginBottom: '5px',
                              }}
                            >
                              • {fileMeta.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Pied de page */}
      <div
        style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          fontSize: '12px',
          color: '#6b7280',
        }}
      >
        <p>Programme - Objectif 2026 | Gétigné Collectif</p>
        <p>Document généré le {new Date().toLocaleString('fr-FR')}</p>
      </div>
    </div>
  );
};

export default ProgramPDFContent;


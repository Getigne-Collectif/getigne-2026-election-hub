import type { ProgramFlagshipProject, FlagshipProjectEffect, FlagshipProjectTimelineEvent } from '@/types/program.types';
import EditorJSRenderer from '@/components/EditorJSRenderer';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { Button } from '@/components/ui/button';
import { FileDown, Sparkles, Clock, Pencil } from 'lucide-react';
import { downloadFileFromUrl, downloadFromSupabasePath } from '@/lib/utils';

interface FlagshipProjectsShowcaseProps {
  projects: ProgramFlagshipProject[];
  isProgramAdmin?: boolean;
  onEditProject?: (project: ProgramFlagshipProject) => void;
}

interface TimelineItemProps {
  event: FlagshipProjectTimelineEvent;
  index: number;
  isLast: boolean;
}

function TimelineItem({ event, index, isLast }: TimelineItemProps) {
  return (
    <div className="group relative flex gap-3 items-start transition-all duration-200">
      {/* Ligne verticale et cercle */}
      <div className="relative flex flex-col items-center flex-shrink-0">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-gray-300 bg-white text-gray-500 shadow-sm transition-all duration-200 group-hover:border-getigne-accent group-hover:bg-getigne-accent group-hover:text-white z-10"
        >
          {event.icon ? (
            <DynamicIcon name={event.icon} className="w-3.5 h-3.5" />
          ) : (
            <span className="font-bold text-xs">{index + 1}</span>
          )}
        </div>
        {!isLast && (
          <div
            className="absolute top-7 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-200 transition-colors duration-200 group-hover:bg-getigne-accent"
            style={{ height: 'calc(100% + 2rem)' }}
          />
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 pb-6">
        <div className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1.5 bg-gray-100 text-gray-600 transition-colors duration-200 group-hover:bg-getigne-accent/10 group-hover:text-getigne-accent">
          {event.date_text}
        </div>
        <h4 className="text-sm font-semibold text-getigne-900 leading-snug transition-colors duration-200 group-hover:text-getigne-accent">
          {event.name}
        </h4>
      </div>
    </div>
  );
}

interface ProjectSectionProps {
  project: ProgramFlagshipProject;
  index: number;
  isProgramAdmin?: boolean;
  onEditProject?: (project: ProgramFlagshipProject) => void;
}

function ProjectSection({ project, index, isProgramAdmin, onEditProject }: ProjectSectionProps) {
  const hasImage = Boolean(project.image_url);

  return (
    <section className="relative py-16 md:py-24 lg:py-32 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Badge numéro */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-getigne-accent text-white shadow-lg">
              <span className="text-2xl md:text-3xl font-bold">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          {/* Titre avec bouton d'édition */}
          <div className="flex items-start justify-between gap-4 mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-getigne-900 leading-tight flex-1">
              {project.title}
            </h2>
            {isProgramAdmin && onEditProject && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditProject(project)}
                className="flex-shrink-0 mt-2"
              >
                <Pencil className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Modifier</span>
              </Button>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] items-start mb-8 md:mb-12">
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-lg flex flex-col">
              {hasImage && (
                <div className="relative overflow-hidden rounded-t-xl md:rounded-t-2xl">
                  <img
                    src={project.image_url!}
                    alt={project.title}
                    className="w-full h-56 md:h-80 lg:h-96 object-cover"
                  />
                  {project.effects && project.effects.length > 0 && (
                    <div className="absolute inset-x-0 bottom-0 px-4 md:px-6 pb-4 flex flex-wrap gap-2">
                      {project.effects.map((effect) => (
                        <span
                          key={effect.id}
                          className="inline-flex items-center gap-2 rounded-full bg-white/95 text-getigne-700 border border-white px-3 py-1 text-xs md:text-sm font-semibold shadow"
                        >
                          {effect.icon && (
                            <span
                              className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                              style={{ backgroundColor: effect.color }}
                            >
                              <DynamicIcon name={effect.icon} className="h-3 w-3" />
                            </span>
                          )}
                          <span>{effect.name}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="p-4 md:p-8 lg:p-10 flex-1">
                {!hasImage && project.effects && project.effects.length > 0 && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {project.effects.map((effect) => (
                      <span
                        key={effect.id}
                        className="inline-flex items-center gap-2 rounded-full bg-gray-100 text-getigne-700 border border-gray-200 px-3 py-1 text-xs md:text-sm font-semibold"
                      >
                        {effect.icon && (
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                            style={{ backgroundColor: effect.color }}
                          >
                            <DynamicIcon name={effect.icon} className="h-3 w-3" />
                          </span>
                        )}
                        <span>{effect.name}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div className="prose prose-base md:prose-lg max-w-none text-gray-700">
                  <EditorJSRenderer data={project.description ?? ''} />
                </div>
              </div>
            </div>

            {(project.timeline && project.timeline.length > 0) || project.file_url ? (
              <aside
                className="bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-lg lg:sticky lg:top-24 self-stretch flex flex-col overflow-hidden"
              >
                {/* En-tête avec horizon - arrondi en haut, droit en bas */}
                {project.timeline && project.timeline.length > 0 && (
                  <>
                    <div className="bg-gradient-to-br from-getigne-accent to-cyan-500 rounded-t-xl md:rounded-t-2xl p-4 text-white">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold leading-tight">
                            {project.timeline_horizon || 'Calendrier'}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Liste des événements */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-0 min-h-0">
                      {project.timeline.map((event, idx) => (
                        <TimelineItem
                          key={event.id}
                          event={event}
                          index={idx}
                          isLast={idx === (project.timeline?.length ?? 1) - 1}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Bouton téléchargement en bas de la card de droite */}
                {project.file_url && (
                  <div className="p-4 md:p-6 border-t border-gray-200">
                    <Button
                      variant="default"
                      className="w-full bg-getigne-accent text-white hover:bg-getigne-accent/90"
                      onClick={async () => {
                        try {
                          if (project.file_path) {
                            await downloadFromSupabasePath(
                              'program_files',
                              project.file_path,
                              project.file_label || 'projet.pdf'
                            );
                          } else {
                            await downloadFileFromUrl(
                              project.file_url!,
                              project.file_label || 'projet.pdf'
                            );
                          }
                        } catch (error) {
                          console.error('Erreur téléchargement:', error);
                        }
                      }}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Télécharger la fiche
                    </Button>
                  </div>
                )}
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function FlagshipProjectsShowcase({ projects, isProgramAdmin, onEditProject }: FlagshipProjectsShowcaseProps) {
  if (!projects || projects.length === 0) return null;

  return (
    <div className="w-full">
      {/* Header section */}
      <div className="bg-gradient-to-r from-getigne-accent to-cyan-500 py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full text-white text-xs md:text-sm font-medium mb-4 md:mb-6">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
              <span>Nos projets structurants</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 md:mb-4 px-4">
              Trois projets phares pour l'avenir
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-white/90 max-w-3xl mx-auto px-4">
              Des initiatives ambitieuses et concrètes pour transformer Gétigné et améliorer la vie de toutes et tous.
            </p>
          </div>
        </div>
      </div>

      {/* Projects */}
      {projects.map((project, index) => (
        <ProjectSection 
          key={project.id} 
          project={project} 
          index={index}
          isProgramAdmin={isProgramAdmin}
          onEditProject={onEditProject}
        />
      ))}
    </div>
  );
}


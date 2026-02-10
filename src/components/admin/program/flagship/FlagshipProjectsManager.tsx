import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import {
  fetchFlagshipProjects,
  createFlagshipProject,
  updateFlagshipProject,
  deleteFlagshipProject,
  updateFlagshipPositions,
} from '@/services/programFlagshipProjects';
import type { ProgramFlagshipProject } from '@/types/program.types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, GripVertical, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import FlagshipProjectForm from './FlagshipProjectForm';

interface FlagshipFormState {
  open: boolean;
  mode: 'create' | 'edit';
  project: ProgramFlagshipProject | null;
}

const defaultFormState: FlagshipFormState = {
  open: false,
  mode: 'create',
  project: null,
};

const queryKey = ['flagship-projects'];

export default function FlagshipProjectsManager() {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<FlagshipFormState>(defaultFormState);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey,
    queryFn: fetchFlagshipProjects,
  });

  const createMutation = useMutation({
    mutationFn: createFlagshipProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Projet phare créé avec succès');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProgramFlagshipProject> }) =>
      updateFlagshipProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Projet phare mis à jour avec succès');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFlagshipProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Projet phare supprimé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: updateFlagshipPositions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Ordre mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors du réordonnancement: ${error.message}`);
    },
  });

  const closeDialog = useCallback(() => {
    setFormState(defaultFormState);
  }, []);

  const openCreateDialog = useCallback(() => {
    if ((projects?.length ?? 0) >= 3) {
      toast.error('Vous ne pouvez créer que 3 projets phares.');
      return;
    }
    setFormState({
      open: true,
      mode: 'create',
      project: null,
    });
  }, [projects]);

  const openEditDialog = useCallback((project: ProgramFlagshipProject) => {
    setFormState({
      open: true,
      mode: 'edit',
      project,
    });
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setProjectToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!projectToDelete) return;
    await deleteMutation.mutateAsync(projectToDelete);
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  }, [projectToDelete, deleteMutation]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || !projects) return;
      if (result.destination.index === result.source.index) return;

      const reordered = Array.from(projects);
      const [moved] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, moved);

      const updates = reordered.map((p, idx) => ({ id: p.id, position: idx }));
      reorderMutation.mutate(updates);
    },
    [projects, reorderMutation],
  );

  const handleFormSubmit = useCallback(
    async (data: Partial<ProgramFlagshipProject>) => {
      // Convertir les noms de champs pour correspondre au service
      const payload = {
        title: data.title!,
        description: data.description!,
        imageUrl: data.image_url,
        imagePath: data.image_path,
        effects: data.effects,
        timeline: data.timeline,
        timelineHorizon: data.timeline_horizon ?? 'Début de mandat',
        fileUrl: data.file_url,
        filePath: data.file_path,
        fileLabel: data.file_label,
      };

      if (formState.mode === 'create') {
        await createMutation.mutateAsync(payload);
      } else if (formState.project) {
        await updateMutation.mutateAsync({ id: formState.project.id, data: payload });
      }
    },
    [formState, createMutation, updateMutation],
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand" />
                Projets phares
              </CardTitle>
              <CardDescription>
                Gérez les 3 projets structurants mis en avant sur la page programme (maximum 3)
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog} disabled={(projects?.length ?? 0) >= 3}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau projet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : !projects || projects.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Sparkles className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium mb-2">Aucun projet phare</p>
              <p className="text-sm mb-4">Créez jusqu'à 3 projets structurants pour votre programme</p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Créer le premier projet
              </Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="flagship-projects">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {projects.map((project, index) => (
                      <Draggable key={project.id} draggableId={project.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"
                          >
                            <div className="flex items-start gap-4 p-6">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-1 cursor-grab text-gray-400 hover:text-gray-600"
                              >
                                <GripVertical className="h-5 w-5" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <Badge variant="secondary" className="text-xs">
                                        #{index + 1}
                                      </Badge>
                                      <h3 className="text-xl font-bold text-brand-900">
                                        {project.title}
                                      </h3>
                                    </div>
                                    {project.image_url && (
                                      <div className="mt-3 w-full h-32 rounded-lg overflow-hidden">
                                        <img
                                          src={project.image_url}
                                          alt={project.title}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => openEditDialog(project)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleDeleteClick(project.id)}
                                      className="text-red-500 hover:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                                  <div>
                                    <span className="font-medium">Effets:</span>{' '}
                                    {project.effects?.length ?? 0}
                                  </div>
                                  <div>
                                    <span className="font-medium">Chronologie:</span>{' '}
                                    {project.timeline?.length ?? 0} événements
                                  </div>
                                  <div>
                                    <span className="font-medium">Fichier:</span>{' '}
                                    {project.file_url ? 'Oui' : 'Non'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={formState.open} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formState.mode === 'create' ? 'Créer un projet phare' : 'Modifier le projet phare'}
            </DialogTitle>
          </DialogHeader>
          <FlagshipProjectForm
            project={formState.project}
            mode={formState.mode}
            onSubmit={handleFormSubmit}
            onCancel={closeDialog}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce projet phare ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

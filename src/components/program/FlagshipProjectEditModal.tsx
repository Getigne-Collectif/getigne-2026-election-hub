import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { updateFlagshipProject } from '@/services/programFlagshipProjects';
import type { ProgramFlagshipProject } from '@/types/program.types';
import FlagshipProjectForm from '@/components/admin/program/flagship/FlagshipProjectForm';

interface FlagshipProjectEditModalProps {
  project: ProgramFlagshipProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function FlagshipProjectEditModal({
  project,
  open,
  onOpenChange,
  onSuccess,
}: FlagshipProjectEditModalProps) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProgramFlagshipProject> }) =>
      updateFlagshipProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-flagship-projects'] });
      toast.success('Projet phare mis à jour avec succès');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });

  const handleSubmit = async (data: Partial<ProgramFlagshipProject>) => {
    if (!project) return;
    
    // Convertir les noms de champs pour correspondre au service
    const payload = {
      title: data.title!,
      description: data.description!,
      imageUrl: data.image_url,
      imagePath: data.image_path,
      effects: data.effects,
      timeline: data.timeline,
      timelineHorizon: data.timeline_horizon,
      fileUrl: data.file_url,
      filePath: data.file_path,
      fileLabel: data.file_label,
    };

    await updateMutation.mutateAsync({ id: project.id, data: payload });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le projet phare</DialogTitle>
        </DialogHeader>
        {project && (
          <FlagshipProjectForm
            project={project}
            mode="edit"
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}




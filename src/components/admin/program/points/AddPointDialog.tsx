
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import PointForm, { ProgramPointFormValues, ProgramPointFormSubmitPayload } from './PointForm';
import { uploadFiles } from './FileUploadService';
import type { ProgramCompetentEntity } from '@/types/program.types';

interface AddPointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programItemId: string;
  onSuccess: () => void;
  competentEntities: ProgramCompetentEntity[];
  isLoadingCompetentEntities?: boolean;
}

export default function AddPointDialog({ 
  open, 
  onOpenChange, 
  programItemId, 
  onSuccess,
  competentEntities,
  isLoadingCompetentEntities = false,
}: AddPointDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    values: ProgramPointFormValues,
    payload: ProgramPointFormSubmitPayload
  ) => {
    setIsSubmitting(true);
    
    try {
      // Get the next position
      const { data: existingPoints } = await supabase
        .from('program_points')
        .select('position')
        .eq('program_item_id', programItemId)
        .order('position', { ascending: false })
        .limit(1);
      
      const nextPosition = existingPoints && existingPoints.length > 0 
        ? existingPoints[0].position + 1 
        : 0;
      
      // Upload files if any
      const uploadedFiles = await uploadFiles(payload.newFiles);

      // Create the program point
      // Handle content: if it's a string, parse it; if it's an object, use it; if it's empty, use default
      let contentData = null;
      if (values.content) {
        if (typeof values.content === 'string') {
          try {
            contentData = JSON.parse(values.content);
          } catch {
            // If parsing fails, use default empty structure
            contentData = { time: Date.now(), blocks: [], version: '2.28.0' };
          }
        } else {
          contentData = values.content;
        }
      } else {
        // No content provided, use default empty structure
        contentData = { time: Date.now(), blocks: [], version: '2.28.0' };
      }

      const { error } = await supabase
        .from('program_points')
        .insert([{
          program_item_id: programItemId,
          title: values.title,
          content: contentData,
          competent_entity_id: values.competent_entity_id ?? null,
          files: uploadedFiles.map((file) => file.url),
          files_metadata: uploadedFiles,
          position: nextPosition,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);
        
      if (error) throw error;
      
      toast.success("Point ajouté avec succès");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Ajouter un point du programme</DialogTitle>
          <DialogDescription>
            Créez un nouveau point pour cette section du programme.
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1">
          <PointForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
            submitLabel="Ajouter"
            competentEntities={competentEntities}
            isLoadingCompetentEntities={isLoadingCompetentEntities}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

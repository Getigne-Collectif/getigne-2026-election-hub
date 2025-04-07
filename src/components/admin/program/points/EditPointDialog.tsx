
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
import PointForm, { ProgramPointFormValues } from './PointForm';
import { uploadFiles } from './FileUploadService';
import { ProgramPoint } from '@/types/program.types';

interface EditPointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  point: ProgramPoint | null;
  onSuccess: () => void;
}

export default function EditPointDialog({ 
  open, 
  onOpenChange, 
  point, 
  onSuccess 
}: EditPointDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!point) return null;

  const defaultValues = {
    title: point.title,
    content: point.content
  };

  const handleSubmit = async (values: ProgramPointFormValues, files: File[]) => {
    setIsSubmitting(true);
    
    try {
      // Upload new files if any
      const newFileUrls = await uploadFiles(files);

      // Get existing files
      const existingFiles = point.files || [];
      
      // Combine existing and new files
      const allFiles = [...existingFiles, ...newFileUrls];

      // Update the program point
      const { error } = await supabase
        .from('program_points')
        .update({
          title: values.title,
          content: values.content,
          files: allFiles,
          updated_at: new Date().toISOString(),
        })
        .eq('id', point.id);
        
      if (error) throw error;
      
      toast.success("Point mis à jour avec succès");
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Modifier un point du programme</DialogTitle>
          <DialogDescription>
            Mettez à jour ce point du programme.
          </DialogDescription>
        </DialogHeader>
        
        <PointForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
          submitLabel="Mettre à jour"
        />
      </DialogContent>
    </Dialog>
  );
}

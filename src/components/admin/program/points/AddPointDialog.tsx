
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

interface AddPointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programItemId: string;
  onSuccess: () => void;
}

export default function AddPointDialog({ 
  open, 
  onOpenChange, 
  programItemId, 
  onSuccess 
}: AddPointDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: ProgramPointFormValues, files: File[]) => {
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
      const fileUrls = await uploadFiles(files);

      // Create the program point
      const { error } = await supabase
        .from('program_points')
        .insert([{
          program_item_id: programItemId,
          title: values.title,
          content: values.content,
          files: fileUrls,
          position: nextPosition,
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Ajouter un point du programme</DialogTitle>
          <DialogDescription>
            Créez un nouveau point pour cette section du programme.
          </DialogDescription>
        </DialogHeader>
        
        <PointForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
          submitLabel="Ajouter"
        />
      </DialogContent>
    </Dialog>
  );
}

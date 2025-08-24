
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Move, Settings } from 'lucide-react';
import PointForm, { ProgramPointFormValues } from './PointForm';
import { uploadFiles } from './FileUploadService';
import { ProgramPoint, ProgramItem } from '@/types/program.types';

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
  const [programSections, setProgramSections] = useState<ProgramItem[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [isSectionChanged, setIsSectionChanged] = useState(false);
  const [showMoveOptions, setShowMoveOptions] = useState(false);

  // Charger toutes les sections de programme
  useEffect(() => {
    const loadProgramSections = async () => {
      const { data, error } = await supabase
        .from('program_items')
        .select('*')
        .order('created_at');
        
      if (error) {
        console.error('Erreur lors du chargement des sections:', error);
        return;
      }
      
      setProgramSections(data || []);
    };

    if (open) {
      loadProgramSections();
    }
  }, [open]);

  // Initialiser la section sélectionnée
  useEffect(() => {
    if (point) {
      setSelectedSectionId(point.program_item_id);
      setIsSectionChanged(false);
      setShowMoveOptions(false);
    }
  }, [point]);

  if (!point) return null;

  const defaultValues = {
    title: point.title,
    content: point.content
  };

  const currentSection = programSections.find(s => s.id === point.program_item_id);
  const selectedSection = programSections.find(s => s.id === selectedSectionId);

  const handleSectionChange = (newSectionId: string) => {
    setSelectedSectionId(newSectionId);
    setIsSectionChanged(newSectionId !== point.program_item_id);
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

      // Si la section a changé, on doit gérer la position dans la nouvelle section
      let newPosition = point.position;
      if (isSectionChanged) {
        // Récupérer la position maximale dans la nouvelle section
        const { data: maxPositionData } = await supabase
          .from('program_points')
          .select('position')
          .eq('program_item_id', selectedSectionId)
          .order('position', { ascending: false })
          .limit(1);
        
        newPosition = (maxPositionData?.[0]?.position || 0) + 1;
      }

      // Update the program point
      const { error } = await supabase
        .from('program_points')
        .update({
          title: values.title,
          content: values.content,
          files: allFiles,
          program_item_id: selectedSectionId,
          position: newPosition,
          updated_at: new Date().toISOString(),
        })
        .eq('id', point.id);
        
      if (error) throw error;
      
      const successMessage = isSectionChanged 
        ? `Point déplacé vers "${selectedSection?.title}" avec succès`
        : "Point mis à jour avec succès";
      
      toast.success(successMessage);
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

        {/* Section des options avancées */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Options avancées</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMoveOptions(!showMoveOptions)}
            >
              {showMoveOptions ? 'Masquer' : 'Déplacer vers une autre section'}
            </Button>
          </div>

          {showMoveOptions && (
            <div className="mt-4 space-y-3 p-3 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="section-select" className="text-sm">Section de destination</Label>
                <Select value={selectedSectionId} onValueChange={handleSectionChange}>
                  <SelectTrigger id="section-select" className="h-9">
                    <SelectValue placeholder="Sélectionner une section" />
                  </SelectTrigger>
                  <SelectContent>
                    {programSections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Indicateur de changement de section */}
              {isSectionChanged && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Move className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-sm">
                    Ce point sera déplacé de <strong>"{currentSection?.title}"</strong> vers <strong>"{selectedSection?.title}"</strong>
                  </AlertDescription>
                </Alert>
              )}

              {/* Bouton de déplacement séparé */}
              {isSectionChanged && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleSubmit(defaultValues, [])}
                    disabled={isSubmitting}
                  >
                    <Move className="h-4 w-4 mr-2" />
                    Déplacer vers {selectedSection?.title}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


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
import PointForm, { ProgramPointFormValues, ProgramPointFormSubmitPayload } from './PointForm';
import { uploadFiles, removeFilesFromStorage } from './FileUploadService';
import { ProgramPoint, ProgramItem, ProgramPointFileMeta, ProgramCompetentEntity } from '@/types/program.types';

interface EditPointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  point: ProgramPoint | null;
  onSuccess: () => void;
  competentEntities: ProgramCompetentEntity[];
  isLoadingCompetentEntities?: boolean;
}

export default function EditPointDialog({ 
  open, 
  onOpenChange, 
  point, 
  onSuccess,
  competentEntities,
  isLoadingCompetentEntities = false,
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
    if (point && point.program_item_id) {
      setSelectedSectionId(point.program_item_id);
      setIsSectionChanged(false);
      setShowMoveOptions(false);
    }
  }, [point]);

  if (!point) return null;

  const currentSection = programSections.find(s => s.id === point.program_item_id);
  const selectedSection = programSections.find(s => s.id === selectedSectionId);

  const handleSectionChange = (newSectionId: string) => {
    setSelectedSectionId(newSectionId);
    setIsSectionChanged(newSectionId !== point.program_item_id);
  };

  const enrichWithPath = (file: ProgramPointFileMeta): ProgramPointFileMeta => {
    if (file.path) return file;
    try {
      const url = new URL(file.url);
      const segments = url.pathname.split('/');
      const bucketIndex = segments.findIndex((segment) => segment === 'program_files');
      const relativePath =
        bucketIndex >= 0 ? segments.slice(bucketIndex + 1).join('/') : undefined;
      return { ...file, path: relativePath || undefined };
    } catch {
      return file;
    }
  };

  const defaultValues = {
    title: point.title,
    content: typeof point.content === 'string' 
      ? JSON.parse(point.content) 
      : point.content,
    competent_entity_id: point.competent_entity_id ?? null,
  };

  const initialFiles: ProgramPointFileMeta[] = (
    point.files_metadata && point.files_metadata.length > 0
      ? point.files_metadata
      : (point.files || []).map((url) => ({
          url,
          label: url.split('/').pop() || 'Fichier',
          path: null,
        }))
  ).map(enrichWithPath);

  const handleSubmit = async (
    values: ProgramPointFormValues,
    payload: ProgramPointFormSubmitPayload
  ) => {
    setIsSubmitting(true);
    
    try {
      // Upload new files if any
      const uploadedFiles = await uploadFiles(payload.newFiles);

      // Prepare existing files with updated labels
      const existingFiles = payload.existingFiles.map(enrichWithPath);

      // Handle removed files
      if (payload.removedFiles.length > 0) {
        await removeFilesFromStorage(
          payload.removedFiles.map((file) => enrichWithPath(file).path || null)
        );
      }

      // Combine existing and new files
      const combinedFiles = [...existingFiles, ...uploadedFiles];

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
      const updatePayload: any = {
        title: values.title,
        content: typeof values.content === 'string' 
          ? JSON.parse(values.content) 
          : values.content,
        competent_entity_id: values.competent_entity_id ?? null,
        files: combinedFiles.map((file) => file.url),
        files_metadata: combinedFiles,
        updated_at: new Date().toISOString(),
      };

      // Ne mettre à jour program_item_id et position que si la section a changé
      if (isSectionChanged && selectedSectionId) {
        updatePayload.program_item_id = selectedSectionId;
        updatePayload.position = newPosition;
      }

      const { error } = await supabase
        .from('program_points')
        .update(updatePayload)
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
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Modifier un point du programme</DialogTitle>
          <DialogDescription>
            Mettez à jour ce point du programme.
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1">
          <PointForm
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
            submitLabel="Mettre à jour"
            initialFiles={initialFiles}
            competentEntities={competentEntities}
            isLoadingCompetentEntities={isLoadingCompetentEntities}
            additionalRightColumn={
              /* Section des options avancées - Dans la colonne de droite */
              <div className="border-t pt-4 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Options avancées</span>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="section-select" className="text-sm font-medium">Déplacer vers une autre section</Label>
                      <Select value={selectedSectionId} onValueChange={handleSectionChange}>
                        <SelectTrigger id="section-select">
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
                        <AlertDescription className="text-blue-800 text-xs">
                          Ce point sera déplacé de <strong>"{currentSection?.title}"</strong> vers <strong>"{selectedSection?.title}"</strong>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

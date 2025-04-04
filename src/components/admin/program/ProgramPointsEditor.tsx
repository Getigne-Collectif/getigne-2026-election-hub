
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, GripVertical, Pencil, Trash2 } from 'lucide-react';
import MarkdownEditor from '@/components/MarkdownEditor';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface ProgramPointsEditorProps {
  programItemId: string;
}

// Form schema for program point
const programPointSchema = z.object({
  content: z.string().min(10, "Le contenu doit comporter au moins 10 caractères"),
});

type ProgramPointFormValues = z.infer<typeof programPointSchema>;

export default function ProgramPointsEditor({ programItemId }: ProgramPointsEditorProps) {
  const [points, setPoints] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPointId, setCurrentPointId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Query to fetch program points
  const { isLoading, refetch } = useQuery({
    queryKey: ['programPoints', programItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_points')
        .select('*')
        .eq('program_item_id', programItemId)
        .order('position', { ascending: true });
        
      if (error) {
        toast.error("Erreur lors du chargement des points du programme");
        throw error;
      }
      
      setPoints(data || []);
      return data;
    },
  });

  // Form setup
  const form = useForm<ProgramPointFormValues>({
    resolver: zodResolver(programPointSchema),
    defaultValues: {
      content: '',
    },
  });

  // Handle opening the edit dialog
  const handleEditClick = (point: any) => {
    form.reset({ content: point.content });
    setCurrentPointId(point.id);
    setIsEditDialogOpen(true);
  };

  // Handle adding a new point
  const handleAddClick = () => {
    form.reset({ content: '' });
    setIsAddDialogOpen(true);
  };

  // Handle form submission for adding a new point
  const onSubmitAdd = async (values: ProgramPointFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Determine the next position
      const nextPosition = points.length > 0 
        ? Math.max(...points.map(p => p.position)) + 1 
        : 0;
      
      const { error } = await supabase
        .from('program_points')
        .insert([{
          program_item_id: programItemId,
          content: values.content,
          position: nextPosition,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);
        
      if (error) throw error;
      
      toast.success("Point ajouté avec succès");
      form.reset();
      setIsAddDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission for editing a point
  const onSubmitEdit = async (values: ProgramPointFormValues) => {
    if (!currentPointId) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('program_points')
        .update({
          content: values.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentPointId);
        
      if (error) throw error;
      
      toast.success("Point mis à jour avec succès");
      form.reset();
      setIsEditDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a point
  const handleDeletePoint = async (pointId: string) => {
    try {
      const { error } = await supabase
        .from('program_points')
        .delete()
        .eq('id', pointId);
        
      if (error) throw error;
      
      toast.success("Point supprimé avec succès");
      refetch();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      console.error("Delete error:", error);
    }
  };

  // Handle drag and drop reordering
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    // Return if dropped in same position
    if (result.destination.index === result.source.index) return;
    
    // Reorder points in the UI
    const reorderedPoints = Array.from(points);
    const [movedPoint] = reorderedPoints.splice(result.source.index, 1);
    reorderedPoints.splice(result.destination.index, 0, movedPoint);
    
    // Update positions
    const updatedPoints = reorderedPoints.map((point, index) => ({
      ...point,
      position: index,
    }));
    
    setPoints(updatedPoints);
    
    // Update in the database
    setIsReordering(true);
    try {
      // Loop through each point and update its position
      for (const point of updatedPoints) {
        const { error } = await supabase
          .from('program_points')
          .update({ position: point.position })
          .eq('id', point.id);
          
        if (error) throw error;
      }
      
      toast.success("Ordre mis à jour");
    } catch (error: any) {
      toast.error(`Erreur lors de la mise à jour de l'ordre: ${error.message}`);
      console.error("Reorder error:", error);
      refetch(); // Refetch to restore original order
    } finally {
      setIsReordering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Points de la section</h3>
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un point
        </Button>
      </div>

      {points.length === 0 ? (
        <div className="text-center py-8 bg-muted/20 rounded-lg">
          <p>Aucun point du programme pour cette section.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Cliquez sur "Ajouter un point" pour commencer.
          </p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="program-points">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {points.map((point, index) => (
                  <Draggable 
                    key={point.id} 
                    draggableId={point.id} 
                    index={index}
                    isDragDisabled={isReordering}
                  >
                    {(provided) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="border"
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div 
                              {...provided.dragHandleProps}
                              className="flex items-center cursor-grab text-muted-foreground"
                              aria-label="Déplacer"
                            >
                              <GripVertical className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <div 
                                className="prose max-w-none prose-sm" 
                                dangerouslySetInnerHTML={{ __html: point.content }} 
                              />
                            </div>
                            <div className="flex gap-2 items-start ml-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditClick(point)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Modifier</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-red-500"
                                onClick={() => handleDeletePoint(point.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Supprimer</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Add Point Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Ajouter un point du programme</DialogTitle>
            <DialogDescription>
              Créez un nouveau point pour cette section du programme.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitAdd)} className="space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenu</FormLabel>
                    <FormControl>
                      <MarkdownEditor
                        value={field.value}
                        onChange={field.onChange}
                        className="min-h-[200px]"
                        contentType="news"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ajout en cours...
                    </>
                  ) : (
                    "Ajouter"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Point Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Modifier un point du programme</DialogTitle>
            <DialogDescription>
              Mettez à jour ce point du programme.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenu</FormLabel>
                    <FormControl>
                      <MarkdownEditor
                        value={field.value}
                        onChange={field.onChange}
                        className="min-h-[200px]"
                        contentType="news"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    "Mettre à jour"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

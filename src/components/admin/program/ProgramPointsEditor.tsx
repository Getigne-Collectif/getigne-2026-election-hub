
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { ProgramPoint } from '@/types/program.types';
import PointList from './points/PointList';
import AddPointDialog from './points/AddPointDialog';
import EditPointDialog from './points/EditPointDialog';

export default function ProgramPointsEditor({ programItemId }: { programItemId: string }) {
  const [points, setPoints] = useState<ProgramPoint[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPointId, setCurrentPointId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

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
      
      // Convert the files from Json to string[] if needed
      const transformedData = data?.map(point => ({
        ...point,
        files: Array.isArray(point.files) ? point.files : []
      })) as ProgramPoint[];
      
      setPoints(transformedData || []);
      return transformedData;
    },
  });

  const handleEditClick = (point: ProgramPoint) => {
    setCurrentPointId(point.id);
    setIsEditDialogOpen(true);
  };

  const handleAddClick = () => {
    setIsAddDialogOpen(true);
  };

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

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    if (result.destination.index === result.source.index) return;
    
    const reorderedPoints = Array.from(points);
    const [movedPoint] = reorderedPoints.splice(result.source.index, 1);
    reorderedPoints.splice(result.destination.index, 0, movedPoint);
    
    const updatedPoints = reorderedPoints.map((point, index) => ({
      ...point,
      position: index,
    }));
    
    setPoints(updatedPoints);
    
    setIsReordering(true);
    try {
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
      refetch();
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

  const getCurrentPoint = () => {
    return points.find(point => point.id === currentPointId) || null;
  };

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
          <PointList 
            points={points} 
            onEdit={handleEditClick} 
            onDelete={handleDeletePoint} 
            isReordering={isReordering}
          />
        </DragDropContext>
      )}

      <AddPointDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        programItemId={programItemId}
        onSuccess={refetch}
      />

      {currentPointId && (
        <EditPointDialog 
          open={isEditDialogOpen} 
          onOpenChange={setIsEditDialogOpen}
          point={getCurrentPoint()}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}

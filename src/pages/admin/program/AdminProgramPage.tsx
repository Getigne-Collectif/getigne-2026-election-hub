
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { generatePath, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Edit, Plus, Trash2, GripVertical } from 'lucide-react';
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DragDropContext, DropResult, Droppable, Draggable } from '@hello-pangea/dnd';
import GeneralPresentationEditor from '@/components/admin/program/GeneralPresentationEditor';
import CompetentEntitiesManager from '@/components/admin/program/competent-entities/CompetentEntitiesManager';
import FlagshipProjectsManager from '@/components/admin/program/flagship/FlagshipProjectsManager';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { Routes } from '@/routes';

export default function AdminProgramPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programItemToDelete, setProgramItemToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("sections");
  const [isReordering, setIsReordering] = useState(false);

  // Fetch program items
  const { data: programItems, isLoading, refetch } = useQuery({
    queryKey: ['programItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_items')
        .select('*')
        .order('position', { ascending: true })
        .order('title', { ascending: true });

      if (error) {
        toast.error("Erreur lors du chargement des éléments du programme");
        throw error;
      }

      return data || [];
    }
  });

  const handleDeleteClick = (id: string) => {
    setProgramItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!programItemToDelete) return;

    try {
      // First delete related program points
      const { error: pointsError } = await supabase
        .from('program_points')
        .delete()
        .eq('program_item_id', programItemToDelete);

      if (pointsError) throw pointsError;

      // Then delete the program item
      const { error } = await supabase
        .from('program_items')
        .delete()
        .eq('id', programItemToDelete);

      if (error) throw error;

      toast.success("Section du programme supprimée avec succès");
      refetch();
    } catch (error) {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
      console.error("Delete error:", error);
    } finally {
      setDeleteDialogOpen(false);
      setProgramItemToDelete(null);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !programItems) return;
    
    if (result.destination.index === result.source.index) return;
    
    const reorderedItems = Array.from(programItems);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);
    
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      position: index,
    }));
    
    setIsReordering(true);
    try {
      for (const item of updatedItems) {
        const { error } = await supabase
          .from('program_items')
          .update({ position: item.position })
          .eq('id', item.id);
          
        if (error) throw error;
      }
      
      toast.success("Ordre des sections mis à jour");
      refetch();
    } catch (error: any) {
      toast.error(`Erreur lors de la mise à jour de l'ordre: ${error.message}`);
      console.error("Reorder error:", error);
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <AdminLayout
      title="Gestion du Programme"
      description="Créez et gérez le contenu du programme politique"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="presentation">Présentation générale</TabsTrigger>
            <TabsTrigger value="sections">Sections thématiques</TabsTrigger>
            <TabsTrigger value="flagship">Projets phares</TabsTrigger>
            <TabsTrigger value="entities">Instances compétentes</TabsTrigger>
          </TabsList>
          
          {activeTab === "sections" && (
            <Button asChild>
              <Link to={'/admin/program/edit'}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Section
              </Link>
            </Button>
          )}
        </div>

        <TabsContent value="presentation" className="space-y-6">
          <GeneralPresentationEditor />
        </TabsContent>

        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Liste des sections du programme</CardTitle>
              <CardDescription>
                Gérez les différentes sections thématiques de votre programme politique. 
                Vous pouvez réorganiser l'ordre en glissant-déposant les sections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-6 text-center">Chargement des sections du programme...</div>
              ) : programItems && programItems.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="program-sections">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                              <TableHead className="w-12"></TableHead>
                              <TableHead>Titre</TableHead>
                              <TableHead>Image</TableHead>
                              <TableHead className="w-[150px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {programItems.map((item, index) => (
                              <Draggable 
                                key={item.id} 
                                draggableId={item.id} 
                                index={index}
                                isDragDisabled={isReordering}
                              >
                                {(provided) => (
                                  <TableRow
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="hover:bg-muted/50"
                                  >
                                    <TableCell>
                                      <div 
                                        {...provided.dragHandleProps}
                                        className="flex items-center justify-center cursor-grab text-muted-foreground hover:text-foreground"
                                        aria-label="Déplacer la section"
                                      >
                                        <GripVertical className="h-4 w-4" />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex justify-center items-center">
                                        <div className="w-8 h-8 flex items-center justify-center text-brand-500 bg-brand-50 rounded-full">
                                          {item.icon ? (
                                            <DynamicIcon name={item.icon} size={16} />
                                          ) : (
                                            <DynamicIcon name="Bookmark" size={16} />
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-2">
                                        <span>{item.title}</span>
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                          #{item.position + 1}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {item.image ? (
                                        <div className="w-10 h-10 rounded-md overflow-hidden">
                                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground text-sm">Aucune</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex space-x-2">
                                        <Button 
                                          variant="outline" 
                                          size="icon" 
                                          asChild
                                        >
                                          <Link to={generatePath(Routes.ADMIN_PROGRAM_EDIT, { id: item.id })}>
                                            <Edit className="h-4 w-4" />
                                            <span className="sr-only">Modifier</span>
                                          </Link>
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="icon"
                                          className="text-red-500"
                                          onClick={() => handleDeleteClick(item.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">Supprimer</span>
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <div className="py-6 text-center text-gray-500">
                  Aucune section de programme trouvée. Créez votre première section en cliquant sur "Nouvelle Section".
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flagship" className="space-y-6">
          <FlagshipProjectsManager />
        </TabsContent>

        <TabsContent value="entities" className="space-y-6">
          <CompetentEntitiesManager />
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette section du programme ? Cette action est irréversible.
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
    </AdminLayout>
  );
}

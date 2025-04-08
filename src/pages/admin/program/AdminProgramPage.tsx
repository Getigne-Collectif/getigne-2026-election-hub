
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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
import { Edit, Plus, Trash2, ArrowUpDown } from 'lucide-react';
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GeneralPresentationEditor from '@/components/admin/program/GeneralPresentationEditor';
import { DynamicIcon } from '@/components/ui/dynamic-icon';

export default function AdminProgramPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programItemToDelete, setProgramItemToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("presentation");

  // Fetch program items
  const { data: programItems, isLoading, refetch } = useQuery({
    queryKey: ['programItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_items')
        .select('*')
        .order('created_at', { ascending: false });

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
    } catch (error: any) {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
      console.error("Delete error:", error);
    } finally {
      setDeleteDialogOpen(false);
      setProgramItemToDelete(null);
    }
  };

  return (
    <AdminLayout
      title="Gestion du Programme"
      description="Créez et gérez le contenu du programme politique"
      breadcrumb={
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Programme</BreadcrumbLink>
          </BreadcrumbItem>
        </>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="presentation">Présentation générale</TabsTrigger>
            <TabsTrigger value="sections">Sections thématiques</TabsTrigger>
          </TabsList>
          
          {activeTab === "sections" && (
            <Button asChild>
              <Link to="/admin/program/edit">
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
                Gérez les différentes sections thématiques de votre programme politique
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-6 text-center">Chargement des sections du programme...</div>
              ) : programItems && programItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex justify-center items-center">
                            <div className="w-8 h-8 flex items-center justify-center text-getigne-500 bg-getigne-50 rounded-full">
                              {item.icon ? (
                                <DynamicIcon name={item.icon} size={16} />
                              ) : (
                                <DynamicIcon name="Bookmark" size={16} />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell className="truncate max-w-[400px]">
                          {item.description.substring(0, 100)}
                          {item.description.length > 100 ? '...' : ''}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              asChild
                            >
                              <Link to={`/admin/program/edit/${item.id}`}>
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
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-6 text-center text-gray-500">
                  Aucune section de programme trouvée. Créez votre première section en cliquant sur "Nouvelle Section".
                </div>
              )}
            </CardContent>
          </Card>
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

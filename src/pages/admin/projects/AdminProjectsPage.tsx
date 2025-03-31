
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Star,
  StarOff
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import AdminLayout from '@/components/admin/AdminLayout';
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import type { Project } from '@/types/projects.types';

export default function AdminProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
  // Fetch projects
  const { data: projects = [], refetch, isLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
        
      if (error) {
        toast.error("Erreur lors du chargement des projets");
        throw error;
      }
      return (data || []) as Project[];
    }
  });

  // Filter projects based on search query
  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle featured status
  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('projects')
      .update({ is_featured: !currentStatus })
      .eq('id', id);
      
    if (error) {
      toast.error("Erreur lors de la mise à jour du statut");
      return;
    }
    
    toast.success("Statut mis à jour avec succès");
    refetch();
  };

  // Delete project
  const confirmDelete = async () => {
    if (!projectToDelete) return;
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectToDelete.id);
      
    if (error) {
      toast.error("Erreur lors de la suppression du projet");
      return;
    }
    
    toast.success("Projet supprimé avec succès");
    setProjectToDelete(null);
    refetch();
  };
  
  return (
    <AdminLayout
      breadcrumb={
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/projects">Projets</BreadcrumbLink>
          </BreadcrumbItem>
        </>
      }
      title="Gestion des projets"
      description="Créez et gérez les projets affichés sur le site"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un projet..."
              className="w-full sm:w-[300px] pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button asChild>
            <Link to="/admin/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau projet
            </Link>
          </Button>
        </div>
        
        <div className="rounded-md border shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Titre</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Date de création</TableHead>
                <TableHead className="w-[180px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Chargement des projets...
                  </TableCell>
                </TableRow>
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "Aucun projet ne correspond à votre recherche" : "Aucun projet n'a été créé"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      {project.is_featured && (
                        <Star className="h-4 w-4 text-amber-400 flex-shrink-0" />
                      )}
                      {project.title}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status === 'active' ? 'Actif' : 'Brouillon'}
                      </span>
                    </TableCell>
                    <TableCell>{project.contact_email || '-'}</TableCell>
                    <TableCell>{new Date(project.created_at || '').toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleFeatured(project.id, project.is_featured || false)}
                          title={project.is_featured ? "Retirer des favoris" : "Mettre en avant"}
                        >
                          {project.is_featured ? 
                            <StarOff className="h-4 w-4" /> : 
                            <Star className="h-4 w-4" />
                          }
                        </Button>
                        <Button variant="outline" size="icon" asChild>
                          <Link to={`/admin/projects/edit/${project.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setProjectToDelete(project)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le projet</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le projet "{projectToDelete?.title}" ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectToDelete(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

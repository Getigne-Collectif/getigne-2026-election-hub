
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, FileEdit, Trash2, Plus, ArrowDown, ArrowUp, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { generatePath, Link, useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Page {
  id: string;
  title: string;
  slug: string;
  parent_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  parent?: Page;
}

interface PagesManagementProps {
  pages: Page[];
  loading: boolean;
  onDeletePage: (id: string) => Promise<void>;
}

const PagesManagement: React.FC<PagesManagementProps> = ({
  pages,
  loading,
  onDeletePage
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const handleConfirmDelete = async () => {
    if (!selectedPage) return;

    try {
      await onDeletePage(selectedPage.id);
      setIsDeleteDialogOpen(false);
      setSelectedPage(null);
      toast({
        title: "Page supprimée",
        description: "La page a été supprimée avec succès",
      });
    } catch (error) {
      console.error("Error deleting page:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de la page",
        variant: "destructive"
      });
    }
  };

  const openDeleteDialog = (page: Page) => {
    setSelectedPage(page);
    setIsDeleteDialogOpen(true);
  };

  const getPageHierarchy = (page: Page): string => {
    if (!page.parent) {
      return page.title;
    }
    return `${getPageHierarchy(page.parent)} > ${page.title}`;
  };

  const filteredPages = pages.filter(page => {
    const searchLower = searchTerm.toLowerCase();
    
    // Filter by search term
    const matchesSearch = page.title.toLowerCase().includes(searchLower) || 
                        page.slug.toLowerCase().includes(searchLower);
    
    // Filter by status
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher une page..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="published">Publié</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => navigate('/admin/pages/new')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Créer une page
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p>Chargement des pages...</p>
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="text-center py-10">
          <p>Aucune page trouvée.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date de modification</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPages.map((page) => (
              <TableRow key={page.id}>
                <TableCell className="font-medium">
                  <Link to={`/admin/pages/edit/${page.id}`}>
                    {page.title}
                  </Link>
                </TableCell>
                <TableCell>/{page.slug}</TableCell>
                <TableCell>
                  {page.parent ? (
                    <div className="flex items-center">
                      <ArrowUp className="h-3 w-3 mr-1.5" />
                      <span>{page.parent.title}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Aucun parent</span>
                  )}
                </TableCell>
                <TableCell>
                  {page.status === 'published' ? (
                    <Badge className="bg-green-100 text-green-800">Publié</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Brouillon</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(page.updated_at), 'dd MMM yyyy', { locale: fr })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/pages/edit/${page.id}`)}
                    >
                      <FileEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link to={`/pages/${page.slug}`} target="_blank">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(page)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement la page
              et toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PagesManagement;

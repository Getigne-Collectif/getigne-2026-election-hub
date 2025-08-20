
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
import { Search, FileEdit, Trash2, Plus, ArrowDown, ArrowUp, ArrowRight, EyeOff, Eye } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { generatePath, Link, useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Routes } from '@/routes';

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
  const [localPages, setLocalPages] = useState<Page[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setLocalPages(pages);
  }, [pages]);

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

  const togglePageStatus = async (page: Page) => {
    const newStatus = page.status === 'published' ? 'draft' : 'published';
    try {
      const { error } = await supabase
        .from('pages')
        .update({ status: newStatus })
        .eq('id', page.id);

      if (error) throw error;

      // Update local state
      setLocalPages(prevPages => 
        prevPages.map(p => p.id === page.id ? { ...p, status: newStatus } : p)
      );

      toast({
        title: newStatus === 'published' ? "Page publiée" : "Page dépubliée",
        description: newStatus === 'published'
          ? "La page est maintenant visible sur le site"
          : "La page n'est plus visible sur le site",
      });

    } catch (error) {
      console.error("Error toggling page status:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du changement de statut de la page",
        variant: "destructive"
      });
    }
  };

  const buildFullPagePath = async (pageId: string): Promise<string> => {
    const pathSegments: string[] = [];
    let currentPageId = pageId;
    const visited = new Set<string>();

    while (currentPageId && !visited.has(currentPageId)) {
      visited.add(currentPageId);

      const currentPage = localPages.find(p => p.id === currentPageId);

      if (!currentPage) break;

      pathSegments.unshift(currentPage.slug);

      currentPageId = currentPage.parent_id;
    }

    return `/pages/${pathSegments.join('/')}`;
  };

  const filteredPages = localPages.filter(page => {
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = page.title.toLowerCase().includes(searchLower) ||
                        page.slug.toLowerCase().includes(searchLower);

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
                  <Link to={generatePath(Routes.ADMIN_PAGES_EDIT, { id: page.id })}>
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
                      onClick={() => navigate(generatePath(Routes.ADMIN_PAGES_EDIT, { id: page.id }))}
                      title="Modifier"
                    >
                      <FileEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const fullPath = await buildFullPagePath(page.id);
                        window.open(fullPath, '_blank');
                      }}
                      title="Voir la page"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePageStatus(page)}
                      title={page.status === 'published' ? 'Dépublier' : 'Publier'}
                    >
                      {page.status === 'published' ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(page)}
                      title="Supprimer"
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

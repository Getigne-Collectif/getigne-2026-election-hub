
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
import { Input } from '@/components/ui/input';
import { Search, FileEdit, Trash2, Plus, ArrowDown, ArrowUp, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Badge } from '@/components/ui/badge';

interface MenuItem {
  id: string;
  label: string;
  page_id: string | null;
  external_url: string | null;
  position: number;
  parent_id: string | null;
  page?: {
    title: string;
    slug: string;
  };
}

interface Page {
  id: string;
  title: string;
  slug: string;
}

interface MenuManagementProps {
  menuItems: MenuItem[];
  loading: boolean;
  onDeleteMenuItem: (id: string) => Promise<void>;
  onReorderMenuItem: (id: string, direction: 'up' | 'down') => Promise<void>;
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  onUpdateMenuItem: (id: string, item: Partial<MenuItem>) => Promise<void>;
}

const menuItemFormSchema = z.object({
  label: z.string().min(1, "Le libellé est requis"),
  linkType: z.enum(['page', 'external']),
  page_id: z.string().optional(),
  external_url: z.string().url("L'URL doit être valide").optional(),
  parent_id: z.string().nullable(),
});

type FormValues = z.infer<typeof menuItemFormSchema>;

const MenuManagement: React.FC<MenuManagementProps> = ({
  menuItems,
  loading,
  onDeleteMenuItem,
  onReorderMenuItem,
  onAddMenuItem,
  onUpdateMenuItem
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [pages, setPages] = useState<Page[]>([]);
  const navigate = useNavigate();

  const editForm = useForm<FormValues>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      label: "",
      linkType: "page",
      page_id: "",
      external_url: "",
      parent_id: null,
    }
  });

  const addForm = useForm<FormValues>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      label: "",
      linkType: "page",
      page_id: "",
      external_url: "",
      parent_id: null,
    }
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('id, title, slug')
        .eq('status', 'published')
        .order('title');

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les pages',
        variant: 'destructive'
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedMenuItem) return;

    try {
      await onDeleteMenuItem(selectedMenuItem.id);
      setIsDeleteDialogOpen(false);
      setSelectedMenuItem(null);
      toast({
        title: "Élément supprimé",
        description: "L'élément de menu a été supprimé avec succès",
      });
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'élément de menu",
        variant: "destructive"
      });
    }
  };

  const openDeleteDialog = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    
    const linkType = menuItem.page_id ? 'page' : 'external';
    
    editForm.reset({
      label: menuItem.label,
      linkType,
      page_id: menuItem.page_id || undefined,
      external_url: menuItem.external_url || undefined,
      parent_id: menuItem.parent_id,
    });
    
    setIsEditDialogOpen(true);
  };

  const openAddDialog = () => {
    addForm.reset({
      label: "",
      linkType: "page",
      page_id: "",
      external_url: "",
      parent_id: null,
    });
    setIsAddDialogOpen(true);
  };

  const handleEdit = async (values: FormValues) => {
    if (!selectedMenuItem) return;

    try {
      const updatedItem: Partial<MenuItem> = {
        label: values.label,
        parent_id: values.parent_id,
      };

      if (values.linkType === 'page') {
        updatedItem.page_id = values.page_id || null;
        updatedItem.external_url = null;
      } else {
        updatedItem.external_url = values.external_url || null;
        updatedItem.page_id = null;
      }

      await onUpdateMenuItem(selectedMenuItem.id, updatedItem);
      setIsEditDialogOpen(false);
      toast({
        title: "Élément mis à jour",
        description: "L'élément de menu a été mis à jour avec succès",
      });
    } catch (error) {
      console.error("Error updating menu item:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'élément de menu",
        variant: "destructive"
      });
    }
  };

  const handleAdd = async (values: FormValues) => {
    try {
      const maxPosition = menuItems.reduce((max, item) => Math.max(max, item.position), 0);
      
      const newItem = {
        label: values.label,
        parent_id: values.parent_id,
        position: maxPosition + 1,
        page_id: values.linkType === 'page' ? values.page_id || null : null,
        external_url: values.linkType === 'external' ? values.external_url || null : null,
      };

      await onAddMenuItem(newItem);
      setIsAddDialogOpen(false);
      toast({
        title: "Élément ajouté",
        description: "L'élément de menu a été ajouté avec succès",
      });
    } catch (error) {
      console.error("Error adding menu item:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'élément de menu",
        variant: "destructive"
      });
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return item.label.toLowerCase().includes(searchLower);
  });

  const renderPageUrl = (item: MenuItem) => {
    if (item.page_id && item.page) {
      return `/pages/${item.page.slug}`;
    }
    return item.external_url || '#';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un élément de menu..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={openAddDialog}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter un élément
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p>Chargement des éléments de menu...</p>
        </div>
      ) : filteredMenuItems.length === 0 ? (
        <div className="text-center py-10">
          <p>Aucun élément de menu trouvé.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Libellé</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMenuItems
              .sort((a, b) => a.position - b.position)
              .map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.parent_id && (
                      <span className="mr-2 text-muted-foreground">↳</span>
                    )}
                    {item.label}
                  </TableCell>
                  <TableCell>
                    {item.page_id ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-800">Page</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-purple-50 text-purple-800">Externe</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <a 
                      href={renderPageUrl(item)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-brand hover:underline"
                    >
                      {item.page_id ? (
                        <>
                          <LinkIcon className="h-3 w-3 mr-1" />
                          {item.page?.title || 'Page non trouvée'}
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {item.external_url}
                        </>
                      )}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onReorderMenuItem(item.id, 'up')}
                        disabled={item.position <= 1}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onReorderMenuItem(item.id, 'down')}
                        disabled={item.position >= menuItems.length}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(item)}
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

      {/* Add Menu Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter un élément de menu</DialogTitle>
            <DialogDescription>
              Créez un nouvel élément dans le menu principal.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Libellé</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Accueil" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="linkType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de lien</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type de lien" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="page">Page interne</SelectItem>
                          <SelectItem value="external">Lien externe</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {addForm.watch('linkType') === 'page' && (
                <FormField
                  control={addForm.control}
                  name="page_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une page" />
                          </SelectTrigger>
                          <SelectContent>
                            {pages.map(page => (
                              <SelectItem key={page.id} value={page.id}>
                                {page.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {addForm.watch('linkType') === 'external' && (
                <FormField
                  control={addForm.control}
                  name="external_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL externe</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://www.example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={addForm.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Élément parent</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Aucun parent (élément racine)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun parent (élément racine)</SelectItem>
                          {menuItems.map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
                <Button type="submit">Ajouter</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Menu Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier un élément de menu</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'élément de menu.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Libellé</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Accueil" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="linkType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de lien</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type de lien" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="page">Page interne</SelectItem>
                          <SelectItem value="external">Lien externe</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {editForm.watch('linkType') === 'page' && (
                <FormField
                  control={editForm.control}
                  name="page_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une page" />
                          </SelectTrigger>
                          <SelectContent>
                            {pages.map(page => (
                              <SelectItem key={page.id} value={page.id}>
                                {page.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {editForm.watch('linkType') === 'external' && (
                <FormField
                  control={editForm.control}
                  name="external_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL externe</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://www.example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={editForm.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Élément parent</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Aucun parent (élément racine)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun parent (élément racine)</SelectItem>
                          {menuItems
                            .filter(item => item.id !== selectedMenuItem?.id)
                            .map(item => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement l'élément de menu
              et tous les éléments enfants associés.
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

export default MenuManagement;

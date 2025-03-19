
import React, { useState } from 'react';
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
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, FileEdit, Trash2, Plus } from 'lucide-react';
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
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  image: string;
  tags: string[];
  status: string;
}

interface NewsFormValues {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  tags: string[];
}

interface NewsManagementProps {
  news: NewsArticle[];
  loading: boolean;
  onCreateNews: (formData: NewsFormValues, status: 'draft' | 'published') => Promise<any>;
  onUpdateNews: (id: string, formData: Partial<NewsFormValues>, status?: string) => Promise<void>;
  onDeleteNews: (id: string) => Promise<void>;
}

// Schema with custom transform for tags
const newsFormSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  excerpt: z.string().min(10, "Le résumé doit contenir au moins 10 caractères"),
  content: z.string().min(50, "Le contenu doit contenir au moins 50 caractères"),
  category: z.string().min(2, "La catégorie est requise"),
  image: z.string().url("L'URL de l'image doit être valide"),
  // We represent tags as string in the form but transform it to string[] for the API
  tags: z.string().optional().transform(val => val ? val.split(',').map(tag => tag.trim()) : []),
});

// Define the form values type from the schema
type FormValues = z.infer<typeof newsFormSchema>;

const NewsManagement: React.FC<NewsManagementProps> = ({ 
  news, 
  loading, 
  onCreateNews,
  onUpdateNews,
  onDeleteNews
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulaire de création/édition
  const form = useForm<FormValues>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      category: "",
      image: "",
      tags: "",
    },
  });

  // Mettre à jour le formulaire avec les données de l'article sélectionné
  React.useEffect(() => {
    if (selectedArticle && isEditDialogOpen) {
      form.reset({
        title: selectedArticle.title,
        excerpt: selectedArticle.excerpt,
        content: selectedArticle.content,
        category: selectedArticle.category,
        image: selectedArticle.image,
        tags: prepareTagsForForm(selectedArticle.tags),
      });
    }
  }, [selectedArticle, isEditDialogOpen, form]);

  // Réinitialiser le formulaire lorsque le dialogue de création s'ouvre
  React.useEffect(() => {
    if (isCreateDialogOpen) {
      form.reset({
        title: "",
        excerpt: "",
        content: "",
        category: "",
        image: "",
        tags: "",
      });
    }
  }, [isCreateDialogOpen, form]);

  // Préparer les champs tags pour l'affichage dans le formulaire
  const prepareTagsForForm = (tags: string[] | undefined) => {
    if (!tags || tags.length === 0) return "";
    return tags.join(', ');
  };

  // Gérer la création d'un article
  const handleCreateNews = async (values: FormValues, status: 'draft' | 'published') => {
    setIsSubmitting(true);
    try {
      // The schema has already transformed tags string to array
      await onCreateNews({
        ...values,
        tags: Array.isArray(values.tags) ? values.tags : []
      }, status);
      
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating news article:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gérer la mise à jour d'un article
  const handleUpdateNews = async (values: FormValues) => {
    if (!selectedArticle) return;
    
    setIsSubmitting(true);
    try {
      // The schema has already transformed tags string to array
      await onUpdateNews(selectedArticle.id, {
        ...values,
        tags: Array.isArray(values.tags) ? values.tags : []
      });
      
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating news article:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gérer la publication/dépublication d'un article
  const handleToggleStatus = async (article: NewsArticle) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      await onUpdateNews(article.id, {}, newStatus);
      toast({
        title: "Statut modifié",
        description: newStatus === 'published' ? "L'article a été publié" : "L'article a été mis en brouillon",
      });
    } catch (error) {
      console.error("Error toggling article status:", error);
    }
  };

  // Gérer la suppression d'un article
  const handleConfirmDelete = async () => {
    if (!selectedArticle) return;
    
    try {
      await onDeleteNews(selectedArticle.id);
      setIsDeleteDialogOpen(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error("Error deleting news article:", error);
    }
  };

  // Ouvrir le dialogue d'édition pour un article
  const openEditDialog = (article: NewsArticle) => {
    setSelectedArticle(article);
    setIsEditDialogOpen(true);
  };

  // Ouvrir le dialogue de suppression pour un article
  const openDeleteDialog = (article: NewsArticle) => {
    setSelectedArticle(article);
    setIsDeleteDialogOpen(true);
  };

  // Filtrer les articles en fonction du terme de recherche
  const filteredNews = news.filter(article => {
    const searchLower = searchTerm.toLowerCase();
    return (
      article.title.toLowerCase().includes(searchLower) ||
      article.excerpt.toLowerCase().includes(searchLower) ||
      article.category.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un article..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Créer un article
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p>Chargement des articles...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-10">
          <p>Aucun article trouvé.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNews.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="font-medium">{article.title}</TableCell>
                <TableCell>{article.category}</TableCell>
                <TableCell>
                  {new Date(article.date).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  {article.status === 'draft' ? (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Brouillon</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-100 text-green-800">Publié</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(article)}
                    >
                      <FileEdit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={article.status === 'draft' ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleStatus(article)}
                    >
                      {article.status === 'draft' ? "Publier" : "Dépublier"}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => openDeleteDialog(article)}
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

      {/* Dialogue de création d'article */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouvel article</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Résumé</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={3} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenu</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={10} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de l'image</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (séparés par des virgules)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={typeof field.value === 'string' ? field.value : Array.isArray(field.value) ? field.value.join(', ') : ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={form.handleSubmit(data => handleCreateNews(data, 'draft'))}
                  disabled={isSubmitting}
                >
                  Enregistrer comme brouillon
                </Button>
                <Button
                  type="button"
                  onClick={form.handleSubmit(data => handleCreateNews(data, 'published'))}
                  disabled={isSubmitting}
                >
                  Publier
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialogue d'édition d'article */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'article</DialogTitle>
          </DialogHeader>

          {selectedArticle && (
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Résumé</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={3} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenu</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={10} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de l'image</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (séparés par des virgules)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={typeof field.value === 'string' ? field.value : Array.isArray(field.value) ? field.value.join(', ') : ''}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2 sm:gap-0 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    onClick={form.handleSubmit(handleUpdateNews)}
                    disabled={isSubmitting}
                  >
                    Mettre à jour
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement l'article
              <strong> {selectedArticle?.title}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NewsManagement;

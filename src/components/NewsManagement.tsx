import React, { useState, useEffect } from 'react';
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
import { Search, FileEdit, Trash2, Plus, Image, Calendar, Tag, MessageSquare, X } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { generatePath, Link } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

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
  author_id?: string;
  publication_date?: string;
  comments_enabled?: boolean;
}

interface NewsFormValues {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string | File;
  tags: string[];
  author_id?: string;
  status?: string;
  publication_date?: string;
  comments_enabled?: boolean;
}

interface NewsManagementProps {
  news: NewsArticle[];
  loading: boolean;
  onCreateNews: (formData: NewsFormValues, status: 'draft' | 'published') => Promise<any>;
  onUpdateNews: (id: string, formData: Partial<NewsFormValues>, status?: string) => Promise<void>;
  onDeleteNews: (id: string) => Promise<void>;
}

const newsFormSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  excerpt: z.string().min(10, "Le résumé doit contenir au moins 10 caractères"),
  content: z.string().min(50, "Le contenu doit contenir au moins 50 caractères"),
  category: z.string().min(2, "La catégorie est requise"),
  image: z.any(),
  tags: z.array(z.string()).default([]),
  author_id: z.string().optional(),
  publication_date: z.date().optional(),
  comments_enabled: z.boolean().default(true),
});

type FormValues = z.infer<typeof newsFormSchema>;

type CategoryType = {
  id: string;
  name: string;
}

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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [users, setUsers] = useState<{id: string, first_name: string, last_name: string, avatar_url?: string}[]>([]);
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      category: "",
      image: undefined,
      tags: [],
      author_id: "",
      publication_date: new Date(),
      comments_enabled: true,
    },
  });

  const fetchCategories = async () => {
    try {
      const { data, error } = await (supabase
        .from('news_categories' as any)
        .select('id, name'));

      if (error) throw error;
      
      if (data) {
        setCategories(data as unknown as CategoryType[]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedArticle && isEditDialogOpen) {
      setImagePreview(selectedArticle.image);
      
      setSelectedTags(selectedArticle.tags || []);

      form.reset({
        title: selectedArticle.title,
        excerpt: selectedArticle.excerpt,
        content: selectedArticle.content,
        category: selectedArticle.category,
        image: selectedArticle.image,
        tags: selectedArticle.tags || [],
        author_id: selectedArticle.author_id || "",
        publication_date: selectedArticle.publication_date ? new Date(selectedArticle.publication_date) : new Date(),
        comments_enabled: selectedArticle.comments_enabled !== false,
      });
    }
  }, [selectedArticle, isEditDialogOpen, form]);

  useEffect(() => {
    if (isCreateDialogOpen) {
      setImagePreview(null);
      
      setSelectedTags([]);

      form.reset({
        title: "",
        excerpt: "",
        content: "",
        category: "",
        image: undefined,
        tags: [],
        author_id: user?.id || "",
        publication_date: new Date(),
        comments_enabled: true,
      });
    }
  }, [isCreateDialogOpen, form, user]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("image", file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      const updatedTags = [...selectedTags, newTag.trim()];
      setSelectedTags(updatedTags);
      form.setValue("tags", updatedTags);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(updatedTags);
    form.setValue("tags", updatedTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError, data } = await supabase.storage
        .from('news_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('news_images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'image:', error);
      throw error;
    }
  };

  const handleCreateNews = async (values: FormValues, status: 'draft' | 'published') => {
    setIsSubmitting(true);
    try {
      let imageUrl = "";
      
      if (values.image instanceof File) {
        imageUrl = await uploadImage(values.image);
      } else if (typeof values.image === 'string') {
        imageUrl = values.image;
      }

      const formData: NewsFormValues = {
        title: values.title,
        excerpt: values.excerpt,
        content: values.content,
        category: values.category,
        image: imageUrl,
        tags: values.tags,
        author_id: values.author_id || user?.id,
        publication_date: values.publication_date ? format(values.publication_date, 'yyyy-MM-dd') : undefined,
        comments_enabled: values.comments_enabled,
      };

      await onCreateNews(formData, status);
      setIsCreateDialogOpen(false);
      toast({
        title: "Article créé",
        description: status === 'published' ? "L'article a été publié avec succès" : "L'article a été enregistré comme brouillon",
      });
    } catch (error) {
      console.error("Error creating news article:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'article",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNews = async (values: FormValues) => {
    if (!selectedArticle) return;

    setIsSubmitting(true);
    try {
      let imageUrl = selectedArticle.image;
      
      if (values.image instanceof File) {
        imageUrl = await uploadImage(values.image);
      } else if (typeof values.image === 'string' && values.image !== selectedArticle.image) {
        imageUrl = values.image;
      }

      const formData: Partial<NewsFormValues> = {
        title: values.title,
        excerpt: values.excerpt,
        content: values.content,
        category: values.category,
        image: imageUrl,
        tags: values.tags,
        author_id: values.author_id || user?.id,
        publication_date: values.publication_date ? format(values.publication_date, 'yyyy-MM-dd') : undefined,
        comments_enabled: values.comments_enabled,
      };

      await onUpdateNews(selectedArticle.id, formData);
      setIsEditDialogOpen(false);
      toast({
        title: "Article mis à jour",
        description: "L'article a été mis à jour avec succès",
      });
    } catch (error) {
      console.error("Error updating news article:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'article",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de l'article.",
        variant: "destructive"
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedArticle) return;

    try {
      await onDeleteNews(selectedArticle.id);
      setIsDeleteDialogOpen(false);
      setSelectedArticle(null);
      toast({
        title: "Article supprimé",
        description: "L'article a été supprimé avec succès",
      });
    } catch (error) {
      console.error("Error deleting news article:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'article",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (article: NewsArticle) => {
    setSelectedArticle(article);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (article: NewsArticle) => {
    setSelectedArticle(article);
    setIsDeleteDialogOpen(true);
  };

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
                <TableCell className="font-medium"><Link to={article.status === 'draft' ? '#' : generatePath('/actualites/:id', {
                  id: article.id
                })}>{article.title}</Link></TableCell>
                <TableCell>{article.category}</TableCell>
                <TableCell>
                  {article.publication_date ? 
                    new Date(article.publication_date).toLocaleDateString('fr-FR') : 
                    new Date(article.date).toLocaleDateString('fr-FR')}
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouvel article</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
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
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category.id} value={category.name}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                    name="author_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auteur</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un auteur" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.first_name} {user.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-4">
                    <FormField
                      control={form.control}
                      name="publication_date"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Date de publication</FormLabel>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: fr })
                                  ) : (
                                    <span>Choisir une date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="comments_enabled"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Commentaires</FormLabel>
                          <div className="flex items-center space-x-2 mt-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>
                              {field.value ? "Activés" : "Désactivés"}
                            </FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormLabel>Tags</FormLabel>
                    <div className="flex items-center mt-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ajouter un tag..."
                        className="mr-2"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        size="sm"
                        onClick={handleAddTag}
                      >
                        <Tag className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedTags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                          {tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <div className="mt-2">
                      <div className="flex items-center gap-3">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md border-gray-300 cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Image className="w-8 h-8 mb-3 text-gray-400" />
                            <p className="text-sm text-gray-500">Cliquez pour télécharger</p>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                      {imagePreview && (
                        <div className="mt-4 relative">
                          <img 
                            src={imagePreview} 
                            alt="Aperçu" 
                            className="max-w-full max-h-48 rounded-md object-cover" 
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              form.setValue("image", "");
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contenu</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={12}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'article</DialogTitle>
          </DialogHeader>

          {selectedArticle && (
            <Form {...form}>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
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
                            <Select 
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une catégorie" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(category => (
                                  <SelectItem key={category.id} value={category.name}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                      name="author_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Auteur</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un auteur" />
                              </SelectTrigger>
                              <SelectContent>
                                {users.map(user => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.first_name} {user.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-4">
                      <FormField
                        control={form.control}
                        name="publication_date"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Date de publication</FormLabel>
                            <FormControl>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: fr })
                                    ) : (
                                      <span>Choisir une date</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="comments_enabled"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Commentaires</FormLabel>
                            <div className="flex items-center space-x-2 mt-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>
                                {field.value ? "Activés" : "Désactivés"}
                              </FormLabel>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormLabel>Tags</FormLabel>
                      <div className="flex items-center mt-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Ajouter un tag..."
                          className="mr-2"
                        />
                        <Button 
                          type="button" 
                          variant="outline"
                          size="sm"
                          onClick={handleAddTag}
                        >
                          <Tag className="h-4 w-4 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedTags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                            {tag}
                            <button type="button" onClick={() => handleRemoveTag(tag)}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <FormItem>
                      <FormLabel>Image</FormLabel>
                      <div className="mt-2">
                        <div className="flex items-center gap-3">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md border-gray-300 cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Image className="w-8 h-8 mb-3 text-gray-400" />
                              <p className="text-sm text-gray-500">Cliquez pour télécharger</p>
                            </div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handleImageChange}
                            />
                          </label>
                        </div>
                        {imagePreview && (
                          <div className="mt-4 relative">
                            <img 
                              src={imagePreview} 
                              alt="Aperçu" 
                              className="max-w-full max-h-48 rounded-md object-cover" 
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview(null);
                                form.setValue("image", "");
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </FormItem>

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contenu</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={12}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

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

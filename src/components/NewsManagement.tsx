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
import { generatePath, Link, useNavigate } from "react-router-dom";
import { supabase, NewsCategory } from '@/integrations/supabase/client';
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

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
    .trim();
};

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  category_id?: string;
  date: string;
  image: string;
  tags: string[];
  status: string;
  author_id?: string;
  publication_date?: string;
  comments_enabled?: boolean;
  slug?: string;
}

interface NewsFormValues {
  title: string;
  excerpt: string;
  content: string;
  category_id: string;
  image: string | File;
  tags: string[];
  author_id?: string;
  status?: string;
  publication_date?: string;
  comments_enabled?: boolean;
  slug?: string;
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
  category_id: z.string().min(2, "La catégorie est requise"),
  image: z.any(),
  tags: z.array(z.string()).default([]),
  author_id: z.string().optional(),
  publication_date: z.date().optional(),
  comments_enabled: z.boolean().default(true),
});

type FormValues = z.infer<typeof newsFormSchema>;

type CategoryType = {
  id: string;
  name: string
}

const NewsManagement: React.FC<NewsManagementProps> = ({
  news,
  loading,
  onUpdateNews,
  onDeleteNews
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      category_id: "",
      image: undefined,
      tags: [],
      author_id: "",
      publication_date: new Date(),
      comments_enabled: true,
    },
  });

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('news_categories')
        .select('id, name')
        .returns<NewsCategory[]>();

      if (error) throw error;

      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
          onClick={() => navigate('/admin/news/new')}
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
            {filteredNews.map((article) => {
              const categoryName = categories.find(cat => cat.id === article.category_id)?.name || article.category || '';

              return (
                <TableRow key={article.id}>
                  <TableCell className="font-medium"><Link to={article.status === 'draft' ? '#' : generatePath('/actualites/:slug', {
                    slug: article.slug || article.id
                  })}>{article.title}</Link></TableCell>
                  <TableCell>{categoryName}</TableCell>
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
                        onClick={() => navigate(`/admin/news/edit/${article.id}`)}
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
              );
            })}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement l'article
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

export default NewsManagement;

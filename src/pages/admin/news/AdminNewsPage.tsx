
import React, { useState, useEffect } from 'react';
import { generatePath, Link, useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client.ts';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { useToast } from '@/components/ui/use-toast.ts';
import { useAuth } from '@/context/AuthContext.tsx';
import AdminLayout from '@/components/admin/AdminLayout.tsx';
import {Home, Loader2, MoreHorizontal, Plus, Search, Eye} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { Label } from '@/components/ui/label.tsx';
import { toast as sonnerToast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";
import { Routes } from '@/routes';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  created_at: string;
  published_at: string | null;
  status: string;
  category_id: string;
  category: string;
  tags: string;
  news_to_tags?: { news_tags: { name: string } }[];
}

interface NewsCategory {
  id: string;
  name: string;
}

const AdminNewsPage = () => {
  const { isAdmin, loading: authLoading, authChecked, isRefreshingRoles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!authChecked || loading) return;

    if (isRefreshingRoles) return;

    if (!isAdmin) {
      navigate('/');
      toast({
        title: 'Accès refusé',
        description: 'Vous n\'avez pas les droits pour accéder à cette page.',
        variant: 'destructive',
      });
    }
  }, [authChecked, loading, isAdmin, navigate, toast, isRefreshingRoles]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('news_categories')
          .select('*')
          .order('name');

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('news')
          .select(`
            *,
            news_to_tags (
              news_tags (
                name
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const transformedData = data.map((article: any) => ({
          ...article,
          category: categories.find(cat => cat.id === article.category_id)?.name || article.category || 'Non catégorisé',
          tags: article.news_to_tags ? article.news_to_tags.map(tag => tag.news_tags.name).join(', ') : '',
        })) as NewsArticle[];

        setArticles(transformedData);
        setFilteredArticles(transformedData);
      } catch (error) {
        console.error('Error fetching articles:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer les articles.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (categories.length > 0) {
      fetchArticles();
    }
  }, [categories, toast]);

  useEffect(() => {
    let filtered = [...articles];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(article => article.category_id === categoryFilter);
    }

    // Filter by status
    if (statusFilter === 'published') {
      filtered = filtered.filter(article => article.status === 'published');
    } else if (statusFilter === 'draft') {
      filtered = filtered.filter(article => article.status === 'draft');
    }

    // Filter by tab
    if (activeTab === 'published') {
      filtered = filtered.filter(article => article.status === 'published');
    } else if (activeTab === 'draft') {
      filtered = filtered.filter(article => article.status === 'draft');
    }

    setFilteredArticles(filtered);
  }, [articles, searchTerm, categoryFilter, statusFilter, activeTab]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        const { error } = await supabase
          .from('news')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setArticles(articles.filter(article => article.id !== id));
        toast({
          title: 'Succès',
          description: 'L\'article a été supprimé.',
        });
      } catch (error) {
        console.error('Error deleting article:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer l\'article.',
          variant: 'destructive',
        });
      }
    }
  };

  const handlePublishToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      const { error } = await supabase
        .from('news')
        .update({
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;

      setArticles(
        articles.map(article =>
          article.id === id
            ? {
                ...article,
                status: newStatus,
                published_at: newStatus === 'published' ? new Date().toISOString() : null,
              }
            : article
        )
      );

      toast({
        title: 'Succès',
        description: `L'article a été ${newStatus === 'published' ? 'publié' : 'dépublié'}.`,
      });
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut de publication.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectArticle = (id: string) => {
    if (selectedArticles.includes(id)) {
      setSelectedArticles(selectedArticles.filter(articleId => articleId !== id));
    } else {
      setSelectedArticles([...selectedArticles, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(filteredArticles.map(article => article.id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkDelete = async () => {
    if (selectedArticles.length === 0) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedArticles.length} article(s) ?`)) {
      try {
        const { error } = await supabase
          .from('news')
          .delete()
          .in('id', selectedArticles);

        if (error) throw error;

        setArticles(articles.filter(article => !selectedArticles.includes(article.id)));
        setSelectedArticles([]);
        setSelectAll(false);

        sonnerToast.success(`${selectedArticles.length} article(s) supprimé(s) avec succès`);
      } catch (error) {
        console.error('Error bulk deleting articles:', error);
        sonnerToast.error('Erreur lors de la suppression des articles');
      }
    }
  };

  const handleBulkPublish = async (publish: boolean) => {
    if (selectedArticles.length === 0) return;

    const newStatus = publish ? 'published' : 'draft';

    try {
      const { error } = await supabase
        .from('news')
        .update({
          status: newStatus,
          published_at: publish ? new Date().toISOString() : null,
        })
        .in('id', selectedArticles);

      if (error) throw error;

      setArticles(
        articles.map(article =>
          selectedArticles.includes(article.id)
            ? {
                ...article,
                status: newStatus,
                published_at: publish ? new Date().toISOString() : null,
              }
            : article
        )
      );

      setSelectedArticles([]);
      setSelectAll(false);

      sonnerToast.success(`${selectedArticles.length} article(s) ${publish ? 'publié(s)' : 'dépublié(s)'} avec succès`);
    } catch (error) {
      console.error('Error bulk publishing articles:', error);
      sonnerToast.error(`Erreur lors de la ${publish ? 'publication' : 'dépublication'} des articles`);
    }
  };

  if (loading && !authChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Gestion des actualités | Admin</title>
      </Helmet>

      <AdminLayout title="Gestion des actualités" description="Tenez au courant les citoyens et sympathisans de Gétigné Collectif.">
        <div className="py-8">
          <div className="flex justify-between items-center mb-6">
            <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Tous</TabsTrigger>
                <TabsTrigger value="published">Publiés</TabsTrigger>
                <TabsTrigger value="draft">Brouillons</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button asChild>
              <Link to="/admin/news/new">
                <Plus className="mr-2 h-4 w-4" /> Nouvel article
              </Link>
            </Button>
          </div>



          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Rechercher un article..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedArticles.length > 0 && (
            <div className="bg-muted p-4 rounded-md mb-4 flex items-center justify-between">
              <div>
                <span className="font-medium">{selectedArticles.length} article(s) sélectionné(s)</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkPublish(true)}
                >
                  Publier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkPublish(false)}
                >
                  Dépublier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        aria-label="Sélectionner tous les articles"
                      />
                    </TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Aucun article trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredArticles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedArticles.includes(article.id)}
                            onCheckedChange={() => handleSelectArticle(article.id)}
                            aria-label={`Sélectionner ${article.title}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link
                            to={generatePath(Routes.ADMIN_NEWS_EDIT, { id: article.id })}
                            className="hover:underline"
                          >
                            {article.title}
                          </Link>
                        </TableCell>
                        <TableCell>{article.category}</TableCell>
                        <TableCell>
                          {article.tags ? (
                            <div className="flex flex-wrap gap-1">
                              {article.tags.split(', ').map((tag, index) => (
                                <Badge key={index} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Aucun tag</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {article.created_at
                            ? format(new Date(article.created_at), 'dd MMM yyyy', { locale: fr })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={article.status === 'published' ? 'default' : 'secondary'}
                          >
                            {article.status === 'published' ? 'Publié' : 'Brouillon'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={generatePath(Routes.ADMIN_NEWS_EDIT, { id: article.id })}>
                                  Modifier
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link 
                                  to={generatePath(Routes.NEWS_DETAIL, { slug: article.slug || article.id })}
                                  className="flex items-center"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Aperçu
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePublishToggle(article.id, article.status)}
                              >
                                {article.status === 'published' ? 'Dépublier' : 'Publier'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(article.id)}
                              >
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </AdminLayout>
    </HelmetProvider>
  );
};

export default AdminNewsPage;

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {X, Search, Calendar, User, FileDown, Rss} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NewsCard } from '@/components/NewsCard';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { toast } from '@/components/ui/use-toast';
import { Routes } from '@/routes';

const ITEMS_PER_PAGE = 9;

const NewsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [newsArticles, setNewsArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Calcul du nombre total de pages
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const categoryParam = queryParams.get('category');
    const tagParam = queryParams.get('tags');
    const searchParam = queryParams.get('search');
    const pageParam = queryParams.get('page');

    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }

    if (tagParam) {
      setSelectedTags(tagParam.split(','));
    }

    if (searchParam) {
      setSearchTerm(searchParam);
    }

    if (pageParam && !isNaN(parseInt(pageParam))) {
      setCurrentPage(parseInt(pageParam));
    }

    fetchCategories();
    fetchTags();
  }, [location.search]);

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, selectedTags, searchTerm, currentPage]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('news_categories')
        .select('*');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      // Récupérer tous les tags disponibles
      const { data, error } = await supabase
        .from('news_tags')
        .select('name')
        .order('name');

      if (error) throw error;

      // Extraire les noms des tags
      const tagNames = data.map(tag => tag.name);
      setAllTags(tagNames);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchNews = async () => {
    try {
      setLoading(true);

      // Calculer le nombre d'éléments à sauter pour la pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Construire la requête de base
      let query = supabase
        .from('news')
        .select(`
          *,
          news_categories(id, name),
          news_to_tags(
            news_tags(name)
          ),
          author:profiles(first_name, last_name)
        `, { count: 'exact' })
        .eq('status', 'published');

      // Ajouter les filtres selon les paramètres
      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      // Pour le filtre par tags, nous devons faire une requête un peu différente
      if (selectedTags.length > 0) {
        // Récupérer d'abord les IDs des tags sélectionnés
        const { data: selectedTagData, error: tagError } = await supabase
            .from('news_tags')
            .select('id')
            .in('name', selectedTags);

        if (tagError) throw tagError;

        // Vérifier que tous les tags sélectionnés existent bien
        if (!selectedTagData || selectedTagData.length !== selectedTags.length) {
          setNewsArticles([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }

        const tagIds = selectedTagData.map(tag => tag.id);

        // Récupérer les correspondances dans news_to_tags pour ces tags
        const { data: newsWithTags, error: newsTagsError } = await supabase
            .from('news_to_tags')
            .select('news_id, tag_id')
            .in('tag_id', tagIds);

        if (newsTagsError) throw newsTagsError;

        // Grouper par news_id pour compter le nombre de tags correspondants
        const newsTagCount = {};
        newsWithTags.forEach(item => {
          newsTagCount[item.news_id] = (newsTagCount[item.news_id] || 0) + 1;
        });

        // Filtrer les articles ayant exactement autant de tags correspondants que de tags sélectionnés
        const newsIds = Object.keys(newsTagCount).filter(
            newsId => newsTagCount[newsId] === tagIds.length
        );

        if (newsIds.length > 0) {
          query = query.in('id', newsIds);
        } else {
          // Aucun article ne correspond à TOUS les tags sélectionnés
          setNewsArticles([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
      }

      // Compléter la requête avec le tri et la pagination
      const { data, error, count } = await query
        .order('date', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Mettre à jour le compteur total
      setTotalCount(count || 0);

      // Transformer les données pour qu'elles soient utilisables par les composants
      const processedData = data.map(item => {
        // Extraire les tags depuis news_to_tags
        const tags = item.news_to_tags
          ? item.news_to_tags.map(tag => tag.news_tags.name)
          : [];

        return {
          ...item,
          category: item.news_categories ? item.news_categories.name : item.category,
          tags
        };
      });

      setNewsArticles(processedData);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de récupérer les actualités. Veuillez rafraîchir la page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadRSS = () => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jqpivqdwblrccjzicnxn.supabase.co';
    window.open(`${baseUrl}/functions/v1/rss-feed`, '_blank');
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
    updateUrl({ category: value, page: "1" });
  };

  const handleTagClick = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(newSelectedTags);
    setCurrentPage(1);
    updateUrl({ tags: newSelectedTags.join(','), page: "1" });
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedTags([]);
    setSearchTerm('');
    setCurrentPage(1);
    navigate(Routes.NEWS);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateUrl({ search: searchTerm, page: "1" });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
    updateUrl({ page: page.toString() });
  };

  const updateUrl = (params: Record<string, string>) => {
    const queryParams = new URLSearchParams(location.search);

    // Mettre à jour ou supprimer les paramètres
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all' || (Array.isArray(value) && value.length === 0)) {
        queryParams.delete(key);
      } else {
        queryParams.set(key, value);
      }
    });

    // Si un paramètre n'est pas dans params, conserver sa valeur actuelle
    if (!params.hasOwnProperty('category') && selectedCategory !== 'all') {
      queryParams.set('category', selectedCategory);
    }

    if (!params.hasOwnProperty('tags') && selectedTags.length > 0) {
      queryParams.set('tags', selectedTags.join(','));
    }

    if (!params.hasOwnProperty('search') && searchTerm) {
      queryParams.set('search', searchTerm);
    }

    if (!params.hasOwnProperty('page') && currentPage > 1) {
      queryParams.set('page', currentPage.toString());
    }

    const queryString = queryParams.toString();
    navigate({
      pathname: Routes.NEWS,
      search: queryString ? `?${queryString}` : ''
    });
  };

  // Générer les éléments de pagination
  const paginationItems = [];
  const maxVisiblePages = 5; // Nombre max de pages à afficher

  if (totalPages > 1) {
    // Ajouter le bouton "Précédent"
    if (currentPage > 1) {
      paginationItems.push(
        <PaginationItem key="prev">
          <PaginationPrevious
            onClick={() => handlePageChange(currentPage - 1)}
            className="cursor-pointer"
          />
        </PaginationItem>
      );
    }

    // Déterminer quelles pages afficher
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Ajuster si on est proche de la fin
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Ajouter ellipsis au début si nécessaire
    if (startPage > 1) {
      paginationItems.push(
        <PaginationItem key="start">
          <PaginationLink
            onClick={() => handlePageChange(1)}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (startPage > 2) {
        paginationItems.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    // Ajouter les pages
    for (let i = startPage; i <= endPage; i++) {
      paginationItems.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={i === currentPage}
            onClick={() => handlePageChange(i)}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Ajouter ellipsis à la fin si nécessaire
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationItems.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      paginationItems.push(
        <PaginationItem key="end">
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Ajouter le bouton "Suivant"
    if (currentPage < totalPages) {
      paginationItems.push(
        <PaginationItem key="next">
          <PaginationNext
            onClick={() => handlePageChange(currentPage + 1)}
            className="cursor-pointer"
          />
        </PaginationItem>
      );
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="pt-24 pb-10 bg-getigne-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-4xl font-bold mb-4">Actualités</h1>
            <p className="text-lg text-getigne-700">
              Suivez l'actualité de notre collectif, nos rencontres, et nos réflexions pour construire ensemble l'avenir de Gétigné.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-getigne-100">
            <form onSubmit={handleSearch} className="flex-1 min-w-[280px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  type="text"
                  placeholder="Rechercher des articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            <div className="flex gap-2">
              {(selectedCategory !== 'all' || selectedTags.length !== 0 || searchTerm) && (
                <Button onClick={handleClearFilters} variant="outline" size="sm">
                  <X size={16} className="mr-1" />
                  Réinitialiser
                </Button>
              )}
              <Button onClick={handleDownloadRSS} variant="outline" size="sm">
                <Rss size={16} className="mr-1" />
                Flux RSS
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-getigne-50 p-6 rounded-lg sticky top-24 text-center">
                <h2 className="font-bold text-lg mb-4">Catégories</h2>
                <Tabs
                  value={selectedCategory}
                  onValueChange={handleCategoryChange}
                  orientation="vertical"
                  className="w-full"
                >
                  <TabsList className="flex flex-col h-auto w-full bg-transparent space-y-1">
                    <TabsTrigger
                      value="all"
                      className="justify-start data-[state=active]:bg-getigne-accent data-[state=active]:text-white"
                    >
                      Toutes les catégories
                    </TabsTrigger>
                    {categories.map(category => (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        className="justify-start data-[state=active]:bg-getigne-accent data-[state=active]:text-white"
                      >
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {allTags.length > 0 && (
                  <div className="mt-8">
                    <h2 className="font-bold text-lg mb-4">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map(tag => (
                        <Badge
                          key={tag}
                          variant={selectedTags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleTagClick(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-3">
              {loading ? (
                <div className="text-center py-12">Chargement des actualités...</div>
              ) : newsArticles.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-xl font-medium mb-2">Aucun résultat trouvé</h3>
                  <p className="text-getigne-700 mb-4">
                    Aucun article ne correspond à vos critères de recherche.
                  </p>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Réinitialiser les filtres
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {newsArticles.map((article) => (
                      <NewsCard key={article.id} article={article} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-12">
                      <Pagination>
                        <PaginationContent>
                          {paginationItems}
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewsPage;

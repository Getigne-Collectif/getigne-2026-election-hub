import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {Calendar, ChevronRight, Home, Search, Tag, X} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";
import { supabase } from "@/integrations/supabase/client";

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  category_id?: string;
  news_categories?: {
    id: string;
    name: string;
  };
  date: string;
  image: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  slug?: string;
}

const NewsCard = ({ article }: { article: NewsArticle }) => {
  const tags = article.tags || [];
  const categoryName = article.news_categories?.name || article.category || '';
  const articleUrl = article.slug 
    ? `/actualites/${article.slug}`
    : `/actualites/${article.id}`;

  return (
    <Link to={articleUrl} className="block">
      <article className="bg-white rounded-xl overflow-hidden shadow-sm border border-getigne-100 hover-lift h-full">
        <div className="relative h-48 overflow-hidden">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute top-0 right-0 bg-getigne-accent text-white px-3 py-1 text-sm font-medium">
            {categoryName}
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center text-getigne-500 text-sm mb-3">
            <Calendar size={14} className="mr-1" />
            <time>{new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
          </div>
          <h3 className="font-medium text-xl mb-2">{article.title}</h3>
          <p className="text-getigne-700 mb-4">{article.excerpt}</p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-getigne-50 text-getigne-700 px-2 py-0.5 rounded-full text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="text-getigne-accent flex items-center text-sm font-medium group">
            Lire la suite
            <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  );
};

const NewsPage = () => {
  const [allNewsArticles, setAllNewsArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [categories, setCategories] = useState(['Tous']);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);

    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }

    const tagsParam = searchParams.getAll('tags');
    if (tagsParam.length > 0) {
      setActiveTags(tagsParam);
    }

    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select(`
            *,
            news_categories(id, name)
          `)
          .eq('status', 'published')
          .order('date', { ascending: false });

        if (error) throw error;

        const processedData = data.map(article => {
          if (!article.tags) {
            article.tags = [];
          }
          
          if (article.news_categories) {
            article.category = article.news_categories.name;
          } 
          
          return article as NewsArticle;
        });

        setAllNewsArticles(processedData);

        const uniqueCategories = ['Tous', ...new Set(processedData.map(article => article.category || '').filter(Boolean))];
        setCategories(uniqueCategories);

        const allTags = new Set<string>();
        processedData.forEach(article => {
          if (Array.isArray(article.tags)) {
            article.tags.forEach(tag => allTags.add(tag));
          }
        });
        setAvailableTags(Array.from(allTags) as string[]);

        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des actualités:', error);
        setError((error as Error).message);
        setLoading(false);
      }
    };

    fetchNews();
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (activeCategory !== 'Tous') {
      params.set('category', activeCategory);
    }

    activeTags.forEach(tag => {
      params.append('tags', tag);
    });

    setSearchParams(params);
  }, [activeCategory, activeTags, setSearchParams]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  const handleTagSelect = (tag: string) => {
    if (!activeTags.includes(tag)) {
      setActiveTags([...activeTags, tag]);
    }
  };

  const handleTagRemove = (tag: string) => {
    setActiveTags(activeTags.filter(t => t !== tag));
  };

  const filteredArticles = allNewsArticles.filter(article => {
    const categoryName = article.news_categories?.name || article.category || '';
    
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Tous' || categoryName === activeCategory;

    const matchesTags = activeTags.length === 0 ||
                        activeTags.every(tag =>
                          Array.isArray(article.tags) && article.tags.includes(tag)
                        );

    return matchesSearch && matchesCategory && matchesTags;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="pt-24 pb-12 bg-getigne-50">
        <div className="container mx-auto px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink to="/">
                  <Home className="h-4 w-4 mr-1" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Actualités</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="max-w-3xl mx-auto text-center">
            <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
              Actualités
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Nos dernières actualités</h1>
            <p className="text-getigne-700 text-lg mb-8">
              Suivez l'actualité de notre collectif, nos rencontres, et nos réflexions pour construire ensemble l'avenir de Gétigné.
            </p>
          </div>
        </div>
      </div>

      <main className="flex-grow py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-8">Chargement des actualités...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">Une erreur est survenue: {error}</div>
          ) : (
            <>
              <div className="max-w-5xl mx-auto mb-12">
                <div className="flex gap-4 items-start">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-getigne-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Rechercher un article..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full md:w-80 border border-getigne-200 rounded-md focus:outline-none focus:ring-2 focus:ring-getigne-accent"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-getigne-700 self-center">Catégories:</span>
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={activeCategory === category ? "default" : "outline"}
                        size="sm"
                        className={
                          activeCategory === category
                            ? "bg-getigne-accent hover:bg-getigne-accent/90 text-white"
                            : "border-getigne-200 text-getigne-700"
                        }
                        onClick={() => handleCategoryChange(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
                {availableTags.length > 0 && (
                  <div>
                    <div className="flex flex-wrap gap-2 w-full items-start">
                      <span className="text-getigne-700 self-center">Tags populaires:</span>
                      <div className="flex flex-wrap gap-2">
                        {availableTags.slice(0, 10).map((tag) => (
                          <Button
                            key={tag}
                            variant="outline"
                            size="sm"
                            className={
                              activeTags.includes(tag)
                                ? "bg-getigne-100 border-getigne-300 text-getigne-700"
                                : "border-getigne-200 text-getigne-700"
                            }
                            onClick={() => handleTagSelect(tag)}
                          >
                            #{tag}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {(activeCategory !== 'Tous' || activeTags.length > 0) && (
                  <div className="flex flex-wrap gap-2 items-center mt-5">
                    {activeCategory !== 'Tous' && (
                      <div className="flex items-center bg-getigne-100 text-getigne-700 px-3 py-1 rounded-full text-sm">
                        Catégorie: {activeCategory}
                        <button
                            onClick={() => handleCategoryChange('Tous')}
                            className="ml-1 p-1 hover:text-getigne-accent"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    {activeTags.map(tag => (
                      <div key={tag} className="flex items-center bg-getigne-100 text-getigne-700 px-3 py-1 rounded-full text-sm">
                        #{tag}
                        <button
                            onClick={() => handleTagRemove(tag)}
                            className="ml-1 p-1 hover:text-getigne-accent"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {filteredArticles.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                  {filteredArticles.map(article => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-xl font-medium mb-2">Aucun article ne correspond à votre recherche</h3>
                  <p className="text-getigne-700">Essayez avec d'autres mots-clés, catégories ou tags</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewsPage;

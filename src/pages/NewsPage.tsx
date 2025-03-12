
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Calendar, ChevronRight, Search, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

const NewsCard = ({ article }) => {
  // Parse tags from the article if they exist
  const tags = article.tags ? Array.isArray(article.tags) ? article.tags : JSON.parse(article.tags) : [];
  
  return (
    <article className="bg-white rounded-xl overflow-hidden shadow-sm border border-getigne-100 hover-lift">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={article.image} 
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute top-0 right-0 bg-getigne-accent text-white px-3 py-1 text-sm font-medium">
          {article.category}
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center text-getigne-500 text-sm mb-3">
          <Calendar size={14} className="mr-1" />
          <time>{new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
        </div>
        <h3 className="font-medium text-xl mb-2">{article.title}</h3>
        <p className="text-getigne-700 mb-4">{article.excerpt}</p>
        
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.map((tag, index) => (
              <Link 
                key={index} 
                to={`/actualites?tags=${tag}`}
                className="bg-getigne-50 text-getigne-700 px-2 py-0.5 rounded-full text-xs hover:bg-getigne-100 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
        
        <Link 
          to={`/actualites/${article.id}`} 
          className="text-getigne-accent flex items-center text-sm font-medium group"
        >
          Lire la suite
          <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
};

const NewsPage = () => {
  const [allNewsArticles, setAllNewsArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [activeTags, setActiveTags] = useState([]);
  const [categories, setCategories] = useState(['Tous']);
  const [availableTags, setAvailableTags] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Parse URL params on first load
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
          .select('*')
          .order('date', { ascending: false });
        
        if (error) throw error;
        
        // Parse tags for each article
        const processedData = data.map(article => {
          if (article.tags && typeof article.tags === 'string') {
            try {
              article.tags = JSON.parse(article.tags);
            } catch (e) {
              console.error('Error parsing tags for article:', article.id);
              article.tags = [];
            }
          } else if (!article.tags) {
            article.tags = [];
          }
          return article;
        });
        
        setAllNewsArticles(processedData);
        
        // Extract unique categories
        const uniqueCategories = ['Tous', ...new Set(data.map(article => article.category))];
        setCategories(uniqueCategories);
        
        // Extract unique tags
        const allTags = new Set();
        processedData.forEach(article => {
          if (Array.isArray(article.tags)) {
            article.tags.forEach(tag => allTags.add(tag));
          }
        });
        setAvailableTags(Array.from(allTags));
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des actualités:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchNews();
  }, [searchParams]);
  
  // Update URL when filters change
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
  
  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };
  
  // Handle tag selection
  const handleTagSelect = (tag) => {
    if (!activeTags.includes(tag)) {
      setActiveTags([...activeTags, tag]);
    }
  };
  
  // Handle tag removal
  const handleTagRemove = (tag) => {
    setActiveTags(activeTags.filter(t => t !== tag));
  };
  
  // Handle clear all filters
  const handleClearFilters = () => {
    setActiveCategory('Tous');
    setActiveTags([]);
    setSearchTerm('');
    navigate('/actualites');
  };
  
  // Filtrer les articles en fonction de la recherche, de la catégorie et des tags
  const filteredArticles = allNewsArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Tous' || article.category === activeCategory;
    
    // Check if article has all selected tags
    const matchesTags = activeTags.length === 0 || 
                        activeTags.every(tag => 
                          Array.isArray(article.tags) && article.tags.includes(tag)
                        );
    
    return matchesSearch && matchesCategory && matchesTags;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 pb-12 bg-getigne-50">
        <div className="container mx-auto px-4">
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

      {/* News content */}
      <main className="flex-grow py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-8">Chargement des actualités...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">Une erreur est survenue: {error}</div>
          ) : (
            <>
              {/* Search and filters */}
              <div className="max-w-5xl mx-auto mb-12">
                <div className="flex flex-col gap-4 items-start">
                  {/* Search */}
                  <div className="relative w-full">
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

                  {/* Applied filters */}
                  {(activeCategory !== 'Tous' || activeTags.length > 0) && (
                    <div className="flex flex-wrap gap-2 items-center w-full">
                      <span className="text-getigne-700">Filtres appliqués:</span>
                      
                      {/* Category chip */}
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
                      
                      {/* Tag chips */}
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
                      
                      {/* Clear filters button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 border-getigne-200 text-xs"
                        onClick={handleClearFilters}
                      >
                        Effacer tous les filtres
                      </Button>
                    </div>
                  )}

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2 w-full">
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
                  
                  {/* Tags */}
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
              </div>

              {/* Articles grid */}
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

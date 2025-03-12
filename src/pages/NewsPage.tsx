
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Calendar, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

const NewsCard = ({ article }) => (
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

const NewsPage = () => {
  const [allNewsArticles, setAllNewsArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [categories, setCategories] = useState(['Tous']);
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .order('date', { ascending: false });
        
        if (error) throw error;
        
        setAllNewsArticles(data);
        
        // Extraire les catégories uniques
        const uniqueCategories = ['Tous', ...new Set(data.map(article => article.category))];
        setCategories(uniqueCategories);
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des actualités:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchNews();
  }, []);
  
  // Filtrer les articles en fonction de la recherche et de la catégorie
  const filteredArticles = allNewsArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Tous' || article.category === activeCategory;
    return matchesSearch && matchesCategory;
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
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  {/* Search */}
                  <div className="relative w-full md:w-auto">
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

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center md:justify-end">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={activeCategory === category ? "default" : "outline"}
                        className={
                          activeCategory === category 
                            ? "bg-getigne-accent hover:bg-getigne-accent/90 text-white" 
                            : "border-getigne-200 text-getigne-700"
                        }
                        onClick={() => setActiveCategory(category)}
                      >
                        {category}
                      </Button>
                    ))}
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
                  <p className="text-getigne-700">Essayez avec d'autres mots-clés ou catégories</p>
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


import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Tag, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import NotFound from './NotFound';

const NewsDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchArticle = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        setArticle(data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'article:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-24 flex-grow flex items-center justify-center">
          <div className="text-center">Chargement de l'article...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !article) {
    return <NotFound />;
  }

  // Parse tags from the article if they exist
  const tags = article.tags ? Array.isArray(article.tags) ? article.tags : JSON.parse(article.tags) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero section with image */}
        <div className="w-full h-[40vh] relative">
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          <img 
            src={article.image} 
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="container px-4 text-center text-white">
              <span className="bg-getigne-accent text-white px-4 py-1 rounded-full text-sm font-medium inline-block mb-4">
                {article.category}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold mb-4">{article.title}</h1>
              <div className="flex items-center justify-center text-getigne-50 text-sm">
                <Calendar size={16} className="mr-1" />
                <time>{new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="prose prose-lg mx-auto">
            <div className="text-xl text-getigne-700 mb-8">{article.excerpt}</div>
            
            {/* Render article content as HTML */}
            <div dangerouslySetInnerHTML={{ __html: article.content }}></div>
            
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8">
                <Tag size={16} className="text-getigne-500 mr-2" />
                {tags.map((tag, index) => (
                  <Link 
                    key={index} 
                    to={`/actualites?tags=${tag}`}
                    className="bg-getigne-50 text-getigne-700 px-3 py-1 rounded-full text-sm hover:bg-getigne-100 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
            
            {/* Back button */}
            <div className="mt-16">
              <Button
                variant="outline"
                className="border-getigne-200"
                onClick={() => navigate('/actualites')}
              >
                <ArrowLeft size={16} className="mr-2" />
                Retour aux actualités
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewsDetailPage;

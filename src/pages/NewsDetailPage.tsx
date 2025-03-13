import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Tag, ArrowLeft, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import NotFound from './NotFound';
import Breadcrumb from '@/components/Breadcrumb';

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  image: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  author?: string;
}

const RelatedArticleCard = ({ article }) => {
  return (
    <Link to={`/actualites/${article.id}`} className="block">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-getigne-100 hover:shadow-md transition-shadow">
        <div className="h-40 overflow-hidden">
          <img 
            src={article.image} 
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="font-medium text-lg mb-2 line-clamp-2">{article.title}</h3>
          <div className="flex items-center text-getigne-500 text-sm">
            <Calendar size={14} className="mr-1" />
            <time>{new Date(article.date).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}</time>
          </div>
        </div>
      </div>
    </Link>
  );
};

const NewsDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        const processedData = {
          ...data,
          tags: Array.isArray(data.tags) ? data.tags : []
        };
        
        setArticle(processedData as NewsArticle);
        
        const tagsArray = Array.isArray(processedData.tags) ? processedData.tags : [];
        
        if (tagsArray.length > 0 || processedData.category) {
          let query = supabase.from('news').select('*').neq('id', id).limit(3);
          
          if (tagsArray.length > 0) {
            const tagsFilter = tagsArray.map(tag => `tags.cs.{${tag}}`).join(',');
            query = query.or(tagsFilter);
          } else if (processedData.category) {
            query = query.eq('category', processedData.category);
          }
          
          const { data: relatedData, error: relatedError } = await query;
          
          if (!relatedError && relatedData.length > 0) {
            const processedRelatedData = relatedData.map(item => ({
              ...item,
              tags: Array.isArray(item.tags) ? item.tags : []
            }));
            setRelatedArticles(processedRelatedData as NewsArticle[]);
          } else {
            const { data: recentData } = await supabase
              .from('news')
              .select('*')
              .neq('id', id)
              .order('date', { ascending: false })
              .limit(3);
              
            const processedRecentData = recentData.map(item => ({
              ...item,
              tags: Array.isArray(item.tags) ? item.tags : []
            }));
            setRelatedArticles(processedRecentData as NewsArticle[]);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'article:', error);
        setError((error as Error).message);
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <Breadcrumb />
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

  const tags = Array.isArray(article?.tags) ? article.tags : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Breadcrumb />
      
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-getigne-accent text-white px-4 py-1 rounded-full text-sm font-medium">
              {article.category}
            </span>
            <div className="flex items-center text-getigne-500 text-sm">
              <Calendar size={16} className="mr-1" />
              <time>{new Date(article.date).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</time>
            </div>
            {article.author && (
              <div className="flex items-center text-getigne-500 text-sm">
                <User size={16} className="mr-1" />
                <span>{article.author}</span>
              </div>
            )}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold mb-6">{article.title}</h1>
          
          <div className="w-full h-[300px] md:h-[400px] mb-8 rounded-xl overflow-hidden">
            <img 
              src={article.image} 
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="prose prose-lg mx-auto">
            <div className="text-xl text-getigne-700 mb-8">{article.excerpt}</div>
            
            <div dangerouslySetInnerHTML={{ __html: article.content }}></div>
            
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
          </div>
          
          {relatedArticles.length > 0 && (
            <div className="mt-16 border-t border-getigne-100 pt-8">
              <h2 className="text-2xl font-bold mb-6">Articles similaires</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedArticles.map(relatedArticle => (
                  <RelatedArticleCard 
                    key={relatedArticle.id} 
                    article={relatedArticle} 
                  />
                ))}
              </div>
            </div>
          )}
          
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
      </main>

      <Footer />
    </div>
  );
};

export default NewsDetailPage;

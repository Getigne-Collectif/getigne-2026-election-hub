import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Tag, ArrowLeft, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import NotFound from './NotFound';
import CommentsSection from '@/components/newsDetail/CommentsSection';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

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
        console.log('Fetching article with ID:', id);
        const { data, error } = await supabase
          .from('news')
          .select(`
            *,
            news_categories(id, name)
          `)
          .eq('id', id)
          .eq('status', 'published') // Ne récupérer que les articles publiés
          .single();

        if (error) {
          console.error('Error fetching article:', error);
          throw error;
        }

        console.log('Fetched article:', data);

        // Ensure tags is an array
        const tags = Array.isArray(data.tags) ? data.tags : [];
        
        // Utiliser le nom de la catégorie depuis la relation news_categories si disponible
        if (data.news_categories) {
          data.category = data.news_categories.name;
        }

        const processedData = {
          ...data,
          tags
        };

        setArticle(processedData as NewsArticle);

        if (tags.length > 0 || processedData.category) {
          let query = supabase.from('news')
            .select(`
              *,
              news_categories(id, name)
            `)
            .eq('status', 'published') // Assurons-nous que les articles liés sont également publiés
            .neq('id', id)
            .limit(3);

          if (tags.length > 0) {
            // Use overlap for array comparison
            query = query.overlaps('tags', tags);
          } else if (processedData.category_id) {
            query = query.eq('category_id', processedData.category_id);
          } else if (processedData.category) {
            // Fallback à la recherche par nom de catégorie pour la compatibilité
            const { data: categoryData } = await supabase
              .from('news_categories')
              .select('id')
              .eq('name', processedData.category)
              .maybeSingle();
              
            if (categoryData?.id) {
              query = query.eq('category_id', categoryData.id);
            }
          }

          const { data: relatedData, error: relatedError } = await query;

          if (!relatedError && relatedData.length > 0) {
            const processedRelatedData = relatedData.map(item => {
              // Utiliser le nom de la catégorie depuis la relation news_categories si disponible
              if (item.news_categories) {
                item.category = item.news_categories.name;
              }
              
              return {
                ...item,
                tags: Array.isArray(item.tags) ? item.tags : []
              };
            });
            setRelatedArticles(processedRelatedData as NewsArticle[]);
          } else {
            const { data: recentData } = await supabase
              .from('news')
              .select(`
                *,
                news_categories(id, name)
              `)
              .eq('status', 'published') // Assurons-nous que les articles récents sont également publiés
              .neq('id', id)
              .order('date', { ascending: false })
              .limit(3);

            const processedRecentData = recentData.map(item => {
              // Utiliser le nom de la catégorie depuis la relation news_categories si disponible
              if (item.news_categories) {
                item.category = item.news_categories.name;
              }
              
              return {
                ...item,
                tags: Array.isArray(item.tags) ? item.tags : []
              };
            });
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

  const tags = Array.isArray(article.tags) ? article.tags : [];
  const categoryName = article.news_categories?.name || article.category || '';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">
                  <Home className="h-4 w-4 mr-1" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/actualites">Actualités</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{article.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-getigne-accent text-white px-4 py-1 rounded-full text-sm font-medium">
                {categoryName}
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

            <div className="prose prose-lg max-w-none mx-auto">
              <div className="text-xl text-getigne-700 mb-8">{article.excerpt}</div>

              <div 
                className="rich-content" 
                dangerouslySetInnerHTML={{ __html: article.content }}
                style={{
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '0.5rem',
                    margin: '1.5rem 0'
                  },
                  '& h2': {
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    margin: '1.5rem 0 1rem'
                  },
                  '& h3': {
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    margin: '1.25rem 0 0.75rem'
                  },
                  '& p': {
                    margin: '1rem 0',
                    lineHeight: '1.7'
                  },
                  '& ul, & ol': {
                    paddingLeft: '1.5rem',
                    margin: '1rem 0'
                  },
                  '& li': {
                    margin: '0.5rem 0'
                  },
                  '& blockquote': {
                    borderLeft: '4px solid #e5e7eb',
                    paddingLeft: '1rem',
                    fontStyle: 'italic',
                    margin: '1.5rem 0'
                  },
                  '& a': {
                    color: '#1d4ed8',
                    textDecoration: 'underline'
                  }
                }}
              ></div>

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

            {id && <CommentsSection newsId={id} />}

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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewsDetailPage;

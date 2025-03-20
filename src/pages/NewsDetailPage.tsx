
import React, { useEffect, useState } from 'react';
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  author_id?: string;
  author?: {
    first_name?: string;
    last_name?: string;
  } | null;
  slug?: string;
  comments_enabled?: boolean;
}

interface RelatedArticleProps {
  article: NewsArticle;
}

const RelatedArticleCard = ({ article }: RelatedArticleProps) => {
  const articleUrl = article.slug
    ? `/actualites/${article.slug}`
    : `/actualites/${article.id}`;

  return (
    <Link to={articleUrl} className="block">
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
  const { slug } = useParams<{slug: string}>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchArticle = async () => {
      try {
        // Try to find by slug first, then by ID if not found
        let query = supabase
          .from('news')
          .select(`
            *,
            news_categories(id, name),
            author:profiles(first_name, last_name)
          `)
          .eq('status', 'published');

        // Check if slug is a UUID (for backward compatibility)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || '');

        if (isUuid) {
          query = query.eq('id', slug);
        } else {
          query = query.eq('slug', slug);
        }

        const { data, error } = await query.single();

        if (error) {
          console.error('Error fetching article:', error);
          throw error;
        }

        if (!data) {
          setError('Article not found');
          setLoading(false);
          return;
        }

        // Ensure tags is an array
        const tags = Array.isArray(data.tags) ? data.tags : [];

        // Utiliser le nom de la catégorie depuis la relation news_categories si disponible
        const categoryName = data.news_categories ? data.news_categories.name : data.category;
        const categoryId = data.category_id || (data.news_categories ? data.news_categories.id : null);

        const processedData: NewsArticle = {
          ...data,
          category: categoryName,
          category_id: categoryId,
          tags
        };

        setArticle(processedData);

        // Only fetch related articles if there are tags or a category_id
        if (tags.length > 0 || categoryId) {
          // Use a type annotation here to avoid deep type instantiation
          const query = supabase.from('news')
            .select(`
              *,
              news_categories(id, name),
              author:profiles(first_name, last_name)
            `)
            .eq('status', 'published')
            .neq('id', data.id)
            .limit(3);

          if (tags.length > 0) {
            // Use overlap for array comparison
            query.overlaps('tags', tags);
          } else if (categoryId) {
            query.eq('category_id', categoryId);
          }

          const { data: relatedData, error: relatedError } = await query;

          if (!relatedError && relatedData && relatedData.length > 0) {
            const processedRelatedData = relatedData.map(item => {
              // Utiliser le nom de la catégorie depuis la relation news_categories si disponible
              const catName = item.news_categories ? item.news_categories.name : item.category;

              return {
                ...item,
                category: catName,
                tags: Array.isArray(item.tags) ? item.tags : []
              } as NewsArticle;
            });
            setRelatedArticles(processedRelatedData);
          } else {
            // If no related articles by tag or category, get recent articles
            const { data: recentData } = await supabase
              .from('news')
              .select(`
                *,
                news_categories(id, name),
                author:profiles(first_name, last_name)
              `)
              .eq('status', 'published')
              .neq('id', data.id)
              .order('date', { ascending: false })
              .limit(3);

            if (recentData && recentData.length > 0) {
              const processedRecentData = recentData.map(item => {
                // Utiliser le nom de la catégorie depuis la relation news_categories si disponible
                const catName = item.news_categories ? item.news_categories.name : item.category;

                return {
                  ...item,
                  category: catName,
                  tags: Array.isArray(item.tags) ? item.tags : []
                } as NewsArticle;
              });
              setRelatedArticles(processedRecentData);
            }
          }
        }

        setLoading(false);
      } catch (error) {
        setError((error as Error).message);
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

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
  const commentsEnabled = article.comments_enabled !== false;
  
  const authorName = article.author 
    ? `${article.author.first_name || ''} ${article.author.last_name || ''}`.trim() 
    : '';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="pt-24 pb-4 bg-getigne-50">
        <div className="container mx-auto px-4">
          <div className="mb-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/actualites')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux actualités
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
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
              {authorName && (
                <div className="flex items-center text-getigne-500 text-sm">
                  <User size={16} className="mr-1" />
                  <span>{authorName}</span>
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

              <div className="rich-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {article.content}
                </ReactMarkdown>
              </div>

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

            {commentsEnabled && article.id && <CommentsSection newsId={article.id} />}

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

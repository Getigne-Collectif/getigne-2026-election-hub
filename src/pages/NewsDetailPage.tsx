import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { useParams, Link, useNavigate, generatePath } from 'react-router-dom';
import { Calendar, Tag, ArrowLeft, User, Edit, Send, Eye } from 'lucide-react';
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
import { Json } from '@/integrations/supabase/types';
import { generateRoutes, Routes } from '@/routes';
import EditorJSRenderer from '@/components/EditorJSRenderer';
import { useAuth } from '@/context/auth';
import { useToast } from '@/components/ui/use-toast';

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
  news_to_tags?: Array<{
    news_tags: {
      name: string;
    };
  }>;
  tags?: string[];
  created_at: string;
  updated_at: string;
  author_id?: string;
  author?: {
    first_name?: string;
    last_name?: string;
  } | null;
  slug?: string;
  comments_enabled?: boolean;
  status?: string;
}

interface RelatedArticleProps {
  article: NewsArticle;
}

const RelatedArticleCard = ({ article }: RelatedArticleProps) => {
  const articleUrl = article.slug
    ? generateRoutes.newsDetail(article.slug)
    : generateRoutes.newsDetail(article.id);

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
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchArticle = async () => {
      try {
        let query = supabase
          .from('news')
          .select(`
            *,
            news_categories(id, name),
            news_to_tags(
              news_tags(name)
            )
          `);

        if (!isAdmin) {
          query = query.eq('status', 'published');
        }

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

        const tags = data.news_to_tags
          ? data.news_to_tags.map(tag => tag.news_tags.name)
          : [];

        const categoryName = data.news_categories ? data.news_categories.name : data.category;
        const categoryId = data.category_id || (data.news_categories ? data.news_categories.id : null);

        const processedData: NewsArticle = {
          ...data,
          category: categoryName,
          category_id: categoryId,
          tags: tags,
          author: null
        };

        if (data.author_id) {
          const { data: authorData, error: authorError } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', data.author_id)
            .single();
          
          if (!authorError && authorData) {
            processedData.author = authorData;
          }
        }

        setArticle(processedData);

        if (tags.length > 0 || categoryId) {
          let relatedArticlesQuery;
          
          if (tags.length > 0) {
            const { data: tagData } = await supabase
              .from('news_tags')
              .select('id')
              .in('name', tags);
            
            if (tagData && tagData.length > 0) {
              const tagIds = tagData.map(t => t.id);
              
              const { data: relatedIds } = await supabase
                .from('news_to_tags')
                .select('news_id')
                .in('tag_id', tagIds)
                .neq('news_id', data.id);
              
              if (relatedIds && relatedIds.length > 0) {
                const uniqueNewsIds = [...new Set(relatedIds.map(r => r.news_id))];
                
                relatedArticlesQuery = supabase.from('news')
                  .select(`
                    *,
                    news_categories(id, name),
                    news_to_tags(
                      news_tags(name)
                    )
                  `)
                  .eq('status', 'published')
                  .in('id', uniqueNewsIds)
                  .limit(3);
              }
            }
          } else if (categoryId) {
            relatedArticlesQuery = supabase.from('news')
              .select(`
                *,
                news_categories(id, name),
                news_to_tags(
                  news_tags(name)
                )
              `)
              .eq('status', 'published')
              .eq('category_id', categoryId)
              .neq('id', data.id)
              .limit(3);
          }

          if (relatedArticlesQuery) {
            const { data: relatedData, error: relatedError } = await relatedArticlesQuery;

            if (!relatedError && relatedData && relatedData.length > 0) {
              const processedRelatedArticles = [];
              
              for (const item of relatedData) {
                const catName = item.news_categories ? item.news_categories.name : item.category;
                
                const itemTags = item.news_to_tags
                  ? item.news_to_tags.map(tag => tag.news_tags.name)
                  : [];

                const relatedArticle: NewsArticle = {
                  ...item,
                  category: catName,
                  tags: itemTags,
                  author: null
                };

                if (item.author_id) {
                  const { data: relatedAuthorData } = await supabase
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', item.author_id)
                    .single();
                  
                  if (relatedAuthorData) {
                    relatedArticle.author = relatedAuthorData;
                  }
                }
                
                processedRelatedArticles.push(relatedArticle);
              }
              
              setRelatedArticles(processedRelatedArticles);
            }
          }
          
          if (relatedArticles.length === 0) {
            const { data: recentData } = await supabase
              .from('news')
              .select(`
                *,
                news_categories(id, name),
                news_to_tags(
                  news_tags(name)
                )
              `)
              .eq('status', 'published')
              .neq('id', data.id)
              .order('date', { ascending: false })
              .limit(3);

            if (recentData && recentData.length > 0) {
              const processedRecentArticles = [];
              
              for (const item of recentData) {
                const catName = item.news_categories ? item.news_categories.name : item.category;
                
                const itemTags = item.news_to_tags
                  ? item.news_to_tags.map(tag => tag.news_tags.name)
                  : [];

                const recentArticle: NewsArticle = {
                  ...item,
                  category: catName,
                  tags: itemTags,
                  author: null
                };

                if (item.author_id) {
                  const { data: recentAuthorData } = await supabase
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', item.author_id)
                    .single();
                  
                  if (recentAuthorData) {
                    recentArticle.author = recentAuthorData;
                  }
                }
                
                processedRecentArticles.push(recentArticle);
              }
              
              setRelatedArticles(processedRecentArticles);
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
  }, [slug, isAdmin]);

  const handlePublish = async () => {
    if (!article || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('news')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', article.id);

      if (error) throw error;

      setArticle({
        ...article,
        status: 'published',
      });

      toast({
        title: 'Article publié',
        description: "L'article a été publié avec succès",
      });
    } catch (error) {
      console.error('Error publishing article:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de publier l\'article.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = () => {
    if (!article) return;
    const editUrl = generatePath(Routes.ADMIN_NEWS_EDIT, { id: article.id });
    navigate(editUrl);
  };

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

  const tags = article.tags || [];
  const categoryName = article.news_categories?.name || article.category || '';
  const commentsEnabled = article.comments_enabled !== false;
  
  const authorName = article.author 
    ? `${article.author.first_name || ''} ${article.author.last_name || ''}`.trim() 
    : '';
  const imageUrl = article.image ? `${window.location.origin}${article.image}` : '';

  return (
    <HelmetProvider>
      <Helmet>
        <title>{`${article.title} | Gétigné Collectif`}</title>
        {article.excerpt && (
          <meta name="description" content={article.excerpt} />
        )}
          {/* Balises OpenGraph pour les réseaux sociaux */}
          <meta property="og:type" content="article" />
          <meta property="og:title" content={article.title} />
          <meta property="og:description" content={article.excerpt} />
          <meta property="og:url" content={`${window.location.origin}${generatePath(Routes.NEWS_DETAIL, {slug: article.slug})}`} />
          {article.image && <meta property="og:image" content={imageUrl} />}
          
          {/* Balises Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={article.title} />
          <meta name="twitter:description" content={article.excerpt} />
          {article.image && <meta name="twitter:image" content={imageUrl} />}
        </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />

        {isAdmin && article.status === 'draft' && (
          <div className="bg-yellow-500 text-white py-4 px-4 shadow-md  mt-[70px]">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Mode aperçu - Article en brouillon</p>
                  <p className="text-sm">Cet article n'est visible que par les administrateurs</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handlePublish}
                  variant="secondary"
                  size="sm"
                  className="bg-white text-yellow-700 hover:bg-gray-100"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Publier
                </Button>
                <Button
                  onClick={handleEdit}
                  variant="secondary"
                  size="sm"
                  className="bg-white text-yellow-700 hover:bg-gray-100"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Éditer
                </Button>
              </div>
            </div>
          </div>
        )}

      <div className="pt-24 pb-4 bg-getigne-50">
        <div className="container mx-auto px-4">
          <div className="mb-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(Routes.NEWS)}
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

            {article.image && (
              <div className="w-full mb-8 rounded-xl overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="prose prose-lg max-w-none mx-auto">
              <EditorJSRenderer data={article.content} />

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8">
                  <Tag size={16} className="text-getigne-500 mr-2" />
                  {tags.map((tag, index) => (
                    <Link
                      key={index}
                      to={`${Routes.NEWS}?tags=${tag}`}
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
                onClick={() => navigate(Routes.NEWS)}
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
    </HelmetProvider>
  );
};

export default NewsDetailPage;
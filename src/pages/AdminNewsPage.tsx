import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import NewsManagement from '@/components/NewsManagement';
import { toast } from '@/components/ui/use-toast';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";
import { Home } from "lucide-react";

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  category_id?: string;
  date: string;
  image: string;
  tags: string[];
  status: string;
  created_at: string;
  updated_at: string;
  author_id?: string;
  publication_date?: string;
  comments_enabled?: boolean;
}

interface NewsFormData {
  title: string;
  excerpt: string;
  content: string;
  category_id: string;
  image: string;
  tags: string[];
  author_id?: string;
  publication_date?: string;
  comments_enabled?: boolean;
}

const AdminNewsPage = () => {
  const { user, isAdmin, loading, authChecked } = useAuth();
  const navigate = useNavigate();
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  const fetchNewsArticles = async () => {
    setPageLoading(true);
    try {
      const { data: newsData, error: newsError } = await supabase
        .from('news')
        .select(`
          *,
          news_categories(id, name)
        `)
        .order('date', { ascending: false });

      if (newsError) throw newsError;

      const transformedData = newsData.map(article => ({
        ...article,
        category: article.category || (article.news_categories ? article.news_categories.name : ''),
        status: article.status || 'published',
        tags: Array.isArray(article.tags) ? article.tags :
              (article.tags ?
                (typeof article.tags === 'string' ?
                  [article.tags] :
                  Array.isArray(JSON.parse(JSON.stringify(article.tags))) ?
                    JSON.parse(JSON.stringify(article.tags)) :
                    []
                ) :
                []
              ),
        comments_enabled: article.comments_enabled !== false,
        author_id: article.author_id || null,
        publication_date: article.publication_date || null
      }));

      setNewsArticles(transformedData);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des actualités:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Impossible de récupérer la liste des actualités.",
        variant: 'destructive'
      });
    } finally {
      setPageLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('news_categories')
        .select('id, name');

      if (error) throw error;
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateNews = async (formData: NewsFormData, status: 'draft' | 'published') => {
    try {
      const newArticle = {
        ...formData,
        category: categories.find(cat => cat.id === formData.category_id)?.name || '',
        date: new Date().toISOString().split('T')[0],
        status
      };

      console.log('Creating new article with data:', newArticle);

      const { data, error } = await supabase
        .from('news')
        .insert(newArticle)
        .select();

      if (error) {
        console.error('Supabase error during insert:', error);
        throw error;
      }

      console.log('Successfully created article, response:', data);

      await fetchNewsArticles();
      return data[0];
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'article:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Une erreur est survenue lors de la création de l'article.",
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleUpdateNews = async (id: string, formData: Partial<NewsFormData>, status?: string) => {
    try {
      if (Object.keys(formData).length === 0 && status !== undefined) {
        const { data: existingArticle, error: fetchError } = await supabase
          .from('news')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error('Error fetching existing article:', fetchError);
          throw fetchError;
        }

        const updateData = {
          ...existingArticle,
          status,
          updated_at: new Date().toISOString()
        };

        delete updateData.id;
        delete updateData.created_at;

        console.log('Updating article with data:', updateData);

        const { data, error } = await supabase
          .from('news')
          .update(updateData)
          .eq('id', id)
          .select();

        if (error) {
          console.error('Error updating news article:', error);
          throw error;
        }

        console.log('Update response:', data);

        await fetchNewsArticles();
        return;
      }

      let updateData: any = { ...formData };

      if (formData.category_id) {
        updateData.category = categories.find(cat => cat.id === formData.category_id)?.name || '';
      }

      if (status !== undefined) {
        updateData.status = status;
      }

      updateData.updated_at = new Date().toISOString();

      console.log('Updating article with ID:', id);
      console.log('Complete update data:', updateData);

      const { data, error } = await supabase
        .from('news')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating news article:', error);
        throw error;
      }

      console.log('Update response:', data);

      await fetchNewsArticles();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'article:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Une erreur est survenue lors de la mise à jour de l'article.",
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      console.log('Deleting article with ID:', id);

      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error during delete:', error);
        throw error;
      }

      console.log('Successfully deleted article');

      setNewsArticles(prevArticles => prevArticles.filter(article => article.id !== id));
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'article:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Une erreur est survenue lors de la suppression de l'article.",
        variant: 'destructive'
      });
      throw error;
    }
  };

  useEffect(() => {
    if (!authChecked) return;

    if (!user) {
      toast({
        title: 'Accès refusé',
        description: "Veuillez vous connecter pour accéder à cette page.",
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    if (user && !isAdmin) {
      toast({
        title: 'Accès refusé',
        description: "Vous n'avez pas les droits d'accès à cette page.",
        variant: 'destructive'
      });
      navigate('/');
      return;
    }

    if (user && isAdmin) {
      console.log("User is admin, fetching news articles");
      fetchNewsArticles();
    }
  }, [user, isAdmin, authChecked, navigate]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && isAdmin && authChecked) {
        fetchNewsArticles();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, isAdmin, authChecked]);

  return (
    <div>
      <div className="min-h-screen">
        <Navbar />

        <div className="pt-24 pb-12 bg-getigne-50">
          <div className="container mx-auto px-4">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">
                    <Home className="h-4 w-4 mr-1" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Administration</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Actualités</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="max-w-3xl mx-auto text-center">
              <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                Administration
              </span>
              <div className="text-center my-4">
                <h1 className="text-4xl md:text-5xl font-bold">Actualités</h1>
              </div>
              <p className="text-getigne-700 text-lg mb-6">
                Gérez l'actualité du collectif.
              </p>
            </div>
          </div>
        </div>

        <section className="py-16">
          <div className="container mx-auto px-4">
            {!authChecked || loading ? (
              <div className="text-center py-10">
                <p>Vérification des droits d'accès...</p>
              </div>
            ) : !user ? (
              <div className="text-center py-10">
                <p>Veuillez vous connecter pour accéder à l'administration.</p>
              </div>
            ) : !isAdmin ? (
              <div className="text-center py-10">
                <p>Vous n'avez pas les droits pour accéder à cette page.</p>
              </div>
            ) : (
              <NewsManagement
                news={newsArticles}
                loading={pageLoading}
                onCreateNews={handleCreateNews}
                onUpdateNews={handleUpdateNews}
                onDeleteNews={handleDeleteNews}
              />
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default AdminNewsPage;

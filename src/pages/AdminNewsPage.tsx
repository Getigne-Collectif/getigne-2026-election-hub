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
import { Json } from '@/integrations/supabase/types';

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  image: string;
  tags: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

interface NewsFormData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  tags: string[];
}

const AdminNewsPage = () => {
  const { user, isAdmin, loading, authChecked } = useAuth();
  const navigate = useNavigate();
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const fetchNewsArticles = async () => {
    setPageLoading(true);
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const transformedData = data.map(article => ({
        ...article,
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
              )
      }));

      setNewsArticles(transformedData as NewsArticle[]);
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

  const handleCreateNews = async (formData: NewsFormData, status: 'draft' | 'published') => {
    try {
      const newArticle = {
        ...formData,
        date: new Date().toISOString().split('T')[0],
        status
      };

      const { data, error } = await supabase
        .from('news')
        .insert(newArticle)
        .select();

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `L'article a été créé avec succès.`
      });

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
      const updateData = {
        ...formData,
        ...(status && { status })
      };

      const { error } = await supabase
        .from('news')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `L'article a été mis à jour avec succès.`
      });

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
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `L'article a été supprimé avec succès.`
      });

      await fetchNewsArticles();
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
      fetchNewsArticles();
    }
  }, [user, isAdmin, authChecked, navigate]);

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
              <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Actualités</h1>
              <p className="text-getigne-700 text-lg mb-6">
                Gérez les articles d'actualité du site.
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

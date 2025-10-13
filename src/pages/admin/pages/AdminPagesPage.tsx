
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client.ts';
import { useToast } from '@/components/ui/use-toast.ts';
import { useAuth } from '@/context/AuthContext.tsx';
import AdminLayout from '@/components/admin/AdminLayout.tsx';
import { Loader2 } from 'lucide-react';
import PagesManagement from '@/components/PagesManagement.tsx';
import {BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator} from "@/components/ui/breadcrumb.tsx";

interface Page {
  id: string;
  title: string;
  slug: string;
  parent_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  parent?: Page;
}

const AdminPagesPage = () => {
  const { isAdmin, authChecked, isRefreshingRoles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authChecked) return;

    if (isRefreshingRoles) return;

    if (!isAdmin) {
      navigate('/');
      toast({
        title: 'Accès refusé',
        description: 'Vous n\'avez pas les droits pour accéder à cette page.',
        variant: 'destructive',
      });
      return;
    }

    fetchPages();
  }, [authChecked, isAdmin, navigate, toast, isRefreshingRoles]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Create a map for quick lookup of pages by ID
      const pagesMap = data.reduce((acc, page) => {
        acc[page.id] = { ...page };
        return acc;
      }, {} as Record<string, Page>);

      // Set parent references
      const pagesWithParents = data.map(page => {
        if (page.parent_id && pagesMap[page.parent_id]) {
          return { ...page, parent: pagesMap[page.parent_id] };
        }
        return page;
      });

      setPages(pagesWithParents);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les pages.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (id: string) => {
    try {
      // Check if the page has children
      const { data: children, error: childrenError } = await supabase
        .from('pages')
        .select('id')
        .eq('parent_id', id);

      if (childrenError) throw childrenError;

      if (children && children.length > 0) {
        toast({
          title: 'Impossible de supprimer',
          description: 'Cette page a des pages enfants. Veuillez d\'abord les supprimer ou modifier leur parent.',
          variant: 'destructive',
        });
        return;
      }

      // Check if the page is used in menu items
      const { data: menuItems, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('id')
        .eq('page_id', id);

      if (menuItemsError) throw menuItemsError;

      if (menuItems && menuItems.length > 0) {
        toast({
          title: 'Impossible de supprimer',
          description: 'Cette page est utilisée dans le menu. Veuillez d\'abord supprimer ou modifier les éléments de menu associés.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPages(pages.filter(page => page.id !== id));
      toast({
        title: 'Succès',
        description: 'La page a été supprimée.',
      });
    } catch (error) {
      console.error('Error deleting page:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la page.',
        variant: 'destructive',
      });
    }
  };

  if (loading && !authChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Gestion des pages | Admin</title>
      </Helmet>

      <AdminLayout title={"Gestion des pages" } description={"Créez, modifiez et supprimer les pages du site."}>
        <div className="py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Gestion des pages</h1>
          </div>

          <PagesManagement
            pages={pages}
            loading={loading}
            onDeletePage={handleDeletePage}
          />
        </div>
      </AdminLayout>
    </HelmetProvider>
  );
};

export default AdminPagesPage;

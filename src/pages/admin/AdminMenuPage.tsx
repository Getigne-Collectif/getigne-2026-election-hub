
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client.ts';
import { useToast } from '@/components/ui/use-toast.ts';
import { useAuth } from '@/context/AuthContext.tsx';
import AdminLayout from '@/components/admin/AdminLayout.tsx';
import { Loader2 } from 'lucide-react';
import MenuManagement from '@/components/MenuManagement.tsx';

interface MenuItem {
  id: string;
  label: string;
  page_id: string | null;
  external_url: string | null;
  position: number;
  parent_id: string | null;
  page?: {
    title: string;
    slug: string;
  };
}

const AdminMenuPage = () => {
  const { isAdmin, authChecked } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authChecked) return;

    if (!isAdmin) {
      navigate('/');
      toast({
        title: 'Accès refusé',
        description: 'Vous n\'avez pas les droits pour accéder à cette page.',
        variant: 'destructive',
      });
      return;
    }

    fetchMenuItems();
  }, [authChecked, isAdmin, navigate, toast]);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          page:page_id (
            title,
            slug
          )
        `)
        .order('position');

      if (error) throw error;

      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les éléments de menu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    try {
      // Check if the item has children
      const childrenItems = menuItems.filter(item => item.parent_id === id);

      if (childrenItems.length > 0) {
        // Recursively delete all children
        for (const child of childrenItems) {
          await handleDeleteMenuItem(child.id);
        }
      }

      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMenuItems(menuItems.filter(item => item.id !== id));
      toast({
        title: 'Succès',
        description: 'L\'élément de menu a été supprimé.',
      });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'élément de menu.',
        variant: 'destructive',
      });
    }
  };

  const handleReorderMenuItem = async (id: string, direction: 'up' | 'down') => {
    try {
      const itemIndex = menuItems.findIndex(item => item.id === id);
      if (itemIndex === -1) return;

      const item = menuItems[itemIndex];

      // Find the adjacent item to swap positions with
      let adjacentIndex;
      if (direction === 'up' && itemIndex > 0) {
        adjacentIndex = itemIndex - 1;
      } else if (direction === 'down' && itemIndex < menuItems.length - 1) {
        adjacentIndex = itemIndex + 1;
      } else {
        return; // Can't move further in this direction
      }

      const adjacentItem = menuItems[adjacentIndex];

      // Swap positions
      const { error: error1 } = await supabase
        .from('menu_items')
        .update({ position: adjacentItem.position })
        .eq('id', item.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from('menu_items')
        .update({ position: item.position })
        .eq('id', adjacentItem.id);

      if (error2) throw error2;

      // Update local state
      const updatedItems = [...menuItems];
      updatedItems[itemIndex] = { ...item, position: adjacentItem.position };
      updatedItems[adjacentIndex] = { ...adjacentItem, position: item.position };

      // Sort by position
      updatedItems.sort((a, b) => a.position - b.position);

      setMenuItems(updatedItems);
    } catch (error) {
      console.error('Error reordering menu item:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de réorganiser les éléments de menu.',
        variant: 'destructive',
      });
    }
  };

  const handleAddMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([item])
        .select(`
          *,
          page:page_id (
            title,
            slug
          )
        `);

      if (error) throw error;

      setMenuItems([...menuItems, data[0]]);
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'élément de menu.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          page:page_id (
            title,
            slug
          )
        `);

      if (error) throw error;

      setMenuItems(menuItems.map(item => item.id === id ? data[0] : item));
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'élément de menu.',
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
        <title>Gestion du menu | Admin</title>
      </Helmet>

      <AdminLayout>
        <div className="py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Gestion du menu</h1>
          </div>

          <MenuManagement
            menuItems={menuItems}
            loading={loading}
            onDeleteMenuItem={handleDeleteMenuItem}
            onReorderMenuItem={handleReorderMenuItem}
            onAddMenuItem={handleAddMenuItem}
            onUpdateMenuItem={handleUpdateMenuItem}
          />
        </div>
      </AdminLayout>
    </HelmetProvider>
  );
};

export default AdminMenuPage;


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/auth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/dynamic-icon';

interface GalaxyItem {
  id: string;
  name: string;
  baseline: string;
  link: string;
  icon: string;
  color: string | null;
  is_external: boolean;
  position: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const AdminGalaxyPage = () => {
  const { isAdmin, authChecked, isRefreshingRoles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<GalaxyItem[]>([]);
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

    fetchItems();
  }, [authChecked, isAdmin, navigate, toast, isRefreshingRoles]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('galaxy_items')
        .select('*')
        .order('position');

      if (error) throw error;

      setItems(data || []);
    } catch (error) {
      console.error('Error fetching galaxy items:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les éléments Galaxy.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    try {
      const { error } = await supabase
        .from('galaxy_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(items.filter(item => item.id !== id));
      toast({
        title: 'Succès',
        description: 'L\'élément a été supprimé.',
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'élément.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const { error } = await supabase
        .from('galaxy_items')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setItems(items.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      ));

      toast({
        title: 'Succès',
        description: `L'élément a été ${newStatus === 'active' ? 'activé' : 'désactivé'}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut.',
        variant: 'destructive',
      });
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const itemIndex = items.findIndex(item => item.id === id);
    if (itemIndex === -1) return;

    let adjacentIndex;
    if (direction === 'up' && itemIndex > 0) {
      adjacentIndex = itemIndex - 1;
    } else if (direction === 'down' && itemIndex < items.length - 1) {
      adjacentIndex = itemIndex + 1;
    } else {
      return;
    }

    const item = items[itemIndex];
    const adjacentItem = items[adjacentIndex];

    try {
      const { error: error1 } = await supabase
        .from('galaxy_items')
        .update({ position: adjacentItem.position })
        .eq('id', item.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from('galaxy_items')
        .update({ position: item.position })
        .eq('id', adjacentItem.id);

      if (error2) throw error2;

      const updatedItems = [...items];
      updatedItems[itemIndex] = { ...item, position: adjacentItem.position };
      updatedItems[adjacentIndex] = { ...adjacentItem, position: item.position };
      updatedItems.sort((a, b) => a.position - b.position);

      setItems(updatedItems);
    } catch (error) {
      console.error('Error reordering items:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de réorganiser les éléments.',
        variant: 'destructive',
      });
    }
  };

  if (!authChecked || loading) {
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
        <title>Galaxy - Administration</title>
      </Helmet>

      <AdminLayout>
        <div className="py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Star className="w-6 h-6 text-getigne-green-500" />
                Galaxy Items
              </h1>
              <p className="text-gray-600">Gérez les éléments du menu flottant</p>
            </div>
            <Button 
              onClick={() => navigate('/admin/galaxy/new')} 
              className="bg-getigne-green-500 hover:bg-getigne-green-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvel élément
            </Button>
          </div>

          <div className="grid gap-4">
            {items.map((item, index) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <div 
                        className={`p-2 rounded-lg text-white ${
                          item.color || 'bg-getigne-green-500'
                        }`}
                        style={item.color ? { backgroundColor: item.color } : {}}
                      >
                        <DynamicIcon name={item.icon} size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500 font-normal">{item.baseline}</p>
                      </div>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                        {item.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                      {item.is_external && (
                        <Badge variant="outline">Externe</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <strong>Lien:</strong> {item.link}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReorder(item.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReorder(item.id, 'down')}
                        disabled={index === items.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(item.id, item.status)}
                      >
                        {item.status === 'active' ? 'Désactiver' : 'Activer'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/galaxy/${item.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {items.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun élément Galaxy
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Commencez par créer votre premier élément pour le menu flottant.
                  </p>
                  <Button 
                    onClick={() => navigate('/admin/galaxy/new')}
                    className="bg-getigne-green-500 hover:bg-getigne-green-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un élément
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </AdminLayout>
    </HelmetProvider>
  );
};

export default AdminGalaxyPage;

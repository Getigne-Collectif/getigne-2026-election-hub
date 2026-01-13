import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/auth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Search, Edit, Trash2, Building2, Users } from 'lucide-react';
import { Routes, generateRoutes } from '@/routes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ExternalGroup } from '@/types/external-directory.types';

const AdminExternalGroupsPage = () => {
  const { isAdmin, authChecked, isRefreshingRoles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [groups, setGroups] = useState<ExternalGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<ExternalGroup | null>(null);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!authChecked) return;
    if (isRefreshingRoles) return;

    if (!isAdmin) {
      navigate('/');
      toast({
        title: 'Accès refusé',
        description: "Vous n'avez pas les droits pour accéder à cette page.",
        variant: 'destructive',
      });
      return;
    }

    fetchGroups();
  }, [authChecked, isAdmin, navigate, toast, isRefreshingRoles]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('external_groups')
        .select('*')
        .order('name');

      if (error) throw error;
      
      const groupsData = data || [];
      setGroups(groupsData);
      
      // Récupérer le nombre de membres pour chaque groupe
      const counts: Record<string, number> = {};
      await Promise.all(
        groupsData.map(async (group) => {
          const { count } = await supabase
            .from('external_contact_groups')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);
          counts[group.id] = count || 0;
        })
      );
      setMemberCounts(counts);
    } catch (error) {
      console.error('Erreur lors de la récupération des groupes:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les groupes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!groupToDelete) return;

    try {
      const { error } = await supabase
        .from('external_groups')
        .delete()
        .eq('id', groupToDelete.id);

      if (error) throw error;

      toast({
        title: 'Groupe supprimé',
        description: 'Le groupe a été supprimé avec succès.',
      });

      fetchGroups();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le groupe.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.city && group.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (group.tags && group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  if (!isAdmin) {
    return null;
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Gestion des groupes externes | Admin</title>
      </Helmet>

      <AdminLayout>
        <div className="py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Groupes externes</h1>
              <p className="text-muted-foreground">
                Gérez les organisations, associations et clubs partenaires
              </p>
            </div>
            <Button onClick={() => navigate(Routes.ADMIN_EXTERNAL_GROUPS_NEW)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau groupe
            </Button>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, ville ou étiquette..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-getigne-accent" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.map((group) => (
                <Card key={group.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex gap-3 p-4">
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-green-100 to-green-50">
                        {group.logo_url ? (
                          <img
                            src={group.logo_url}
                            alt={group.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-green-600" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <h3 className="font-semibold text-base truncate">{group.name}</h3>
                          {group.city && (
                            <p className="text-sm text-muted-foreground">{group.city}</p>
                          )}
                        </div>

                        {group.tags && group.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {group.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {group.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{group.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{memberCounts[group.id] || 0} membre{(memberCounts[group.id] || 0) > 1 ? 's' : ''}</span>
                        </div>

                        {group.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {group.description}
                          </p>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              navigate(generateRoutes.adminExternalGroupsEdit(group.id))
                            }
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Modifier
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setGroupToDelete(group);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && filteredGroups.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'Aucun groupe trouvé pour cette recherche.'
                    : 'Aucun groupe externe. Commencez par en ajouter un.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {groupToDelete?.name} ? Cette action est irréversible.
              {memberCounts[groupToDelete?.id || ''] > 0 && (
                <span className="block mt-2 text-orange-600 font-medium">
                  Attention : Ce groupe a {memberCounts[groupToDelete?.id || '']} membre(s) associé(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </HelmetProvider>
  );
};

export default AdminExternalGroupsPage;

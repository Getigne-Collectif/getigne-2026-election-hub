import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  GripVertical,
} from 'lucide-react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ThematicRole, ThematicRoleInsert } from '@/types/electoral.types';

const AdminThematicRolesPage = () => {
  const { isAdmin, authChecked, isRefreshingRoles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roles, setRoles] = useState<ThematicRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<ThematicRole | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<ThematicRole> | null>(null);
  const [saving, setSaving] = useState(false);

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

    fetchRoles();
  }, [authChecked, isAdmin, navigate, toast, isRefreshingRoles]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('thematic_roles')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des rôles:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les rôles thématiques.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;

    try {
      const { error } = await supabase
        .from('thematic_roles')
        .delete()
        .eq('id', roleToDelete.id);

      if (error) throw error;

      toast({
        title: 'Rôle supprimé',
        description: 'Le rôle thématique a été supprimé avec succès.',
      });

      fetchRoles();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le rôle.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleSave = async () => {
    if (!editingRole) return;

    // Validation
    if (!editingRole.name?.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom est requis.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingRole.id) {
        // Mise à jour
        const { error } = await supabase
          .from('thematic_roles')
          .update({
            name: editingRole.name,
            description: editingRole.description || null,
            color: editingRole.color || null,
            icon: editingRole.icon || null,
          })
          .eq('id', editingRole.id);

        if (error) throw error;

        toast({
          title: 'Rôle mis à jour',
          description: 'Le rôle thématique a été mis à jour avec succès.',
        });
      } else {
        // Création
        const maxSortOrder = roles.length > 0 
          ? Math.max(...roles.map(r => r.sort_order)) 
          : 0;

        const insertData: ThematicRoleInsert = {
          name: editingRole.name,
          description: editingRole.description || null,
          color: editingRole.color || null,
          icon: editingRole.icon || null,
          sort_order: maxSortOrder + 1,
        };

        const { error } = await supabase
          .from('thematic_roles')
          .insert(insertData);

        if (error) throw error;

        toast({
          title: 'Rôle créé',
          description: 'Le rôle thématique a été créé avec succès.',
        });
      }

      fetchRoles();
      setEditDialogOpen(false);
      setEditingRole(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le rôle.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openCreateDialog = () => {
    setEditingRole({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: '',
    });
    setEditDialogOpen(true);
  };

  const openEditDialog = (role: ThematicRole) => {
    setEditingRole(role);
    setEditDialogOpen(true);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Gestion des rôles thématiques | Admin</title>
      </Helmet>

      <AdminLayout>
        <div className="py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Rôles thématiques</h1>
              <p className="text-muted-foreground">
                Gérez les rôles thématiques pour la liste électorale
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau rôle
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-getigne-accent" />
            </div>
          ) : (
            <div className="grid gap-4">
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: role.color || '#ccc' }}
                      />
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{role.name}</h3>
                        {role.description && (
                          <p className="text-sm text-muted-foreground">
                            {role.description}
                          </p>
                        )}
                        {role.icon && (
                          <p className="text-xs text-gray-500 mt-1">
                            Icône: {role.icon}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setRoleToDelete(role);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && roles.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Aucun rôle thématique. Commencez par en ajouter un.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>

      {/* Dialog de création/édition */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRole?.id ? 'Modifier le rôle' : 'Nouveau rôle'}
            </DialogTitle>
            <DialogDescription>
              {editingRole?.id
                ? 'Modifiez les informations du rôle thématique'
                : 'Ajoutez un nouveau rôle thématique pour la liste'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={editingRole?.name || ''}
                onChange={(e) =>
                  setEditingRole({ ...editingRole, name: e.target.value })
                }
                placeholder="ex: Urbanisme, Enfance..."
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editingRole?.description || ''}
                onChange={(e) =>
                  setEditingRole({ ...editingRole, description: e.target.value })
                }
                placeholder="Courte description du domaine..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="color">Couleur</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={editingRole?.color || '#3B82F6'}
                  onChange={(e) =>
                    setEditingRole({ ...editingRole, color: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={editingRole?.color || '#3B82F6'}
                  onChange={(e) =>
                    setEditingRole({ ...editingRole, color: e.target.value })
                  }
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="icon">Icône (lucide-react)</Label>
              <Input
                id="icon"
                value={editingRole?.icon || ''}
                onChange={(e) =>
                  setEditingRole({ ...editingRole, icon: e.target.value })
                }
                placeholder="ex: Building2, Users, Heart..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nom de l'icône depuis lucide-react
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingRole(null);
              }}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le rôle "{roleToDelete?.name}" ?
              Cette action est irréversible.
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

export default AdminThematicRolesPage;







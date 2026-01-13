import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/auth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, ArrowLeft, X } from 'lucide-react';
import { Routes } from '@/routes';
import TagsInput from '@/components/admin/external/TagsInput';
import GroupSelector, { GroupWithRole } from '@/components/admin/external/GroupSelector';
import type { ExternalContact, ExternalContactInsert, ExternalContactUpdate, ExternalContactWithGroups } from '@/types/external-directory.types';

const AdminExternalContactFormPage = () => {
  const { id } = useParams();
  const { isAdmin, authChecked, isRefreshingRoles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<Partial<ExternalContact>>({
    first_name: '',
    last_name: '',
    photo_url: '',
    email: '',
    phone: '',
    city: '',
    note: '',
    tags: [],
  });

  const [selectedGroups, setSelectedGroups] = useState<GroupWithRole[]>([]);

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

    fetchAllTags();
    
    if (id) {
      fetchContact();
    }
  }, [id, authChecked, isAdmin, navigate, toast, isRefreshingRoles]);

  const fetchAllTags = async () => {
    try {
      const { data, error } = await supabase
        .from('external_contacts')
        .select('tags');

      if (error) throw error;
      
      const tagsSet = new Set<string>();
      data?.forEach(item => {
        item.tags?.forEach(tag => tagsSet.add(tag));
      });
      
      setAllTags(Array.from(tagsSet).sort());
    } catch (error) {
      console.error('Erreur lors de la récupération des tags:', error);
    }
  };

  const fetchContact = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data: contactData, error: contactError } = await supabase
        .from('external_contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (contactError) throw contactError;
      setFormData(contactData);

      // Récupérer les groupes associés
      const { data: groupsData, error: groupsError } = await supabase
        .from('external_contact_groups')
        .select(`
          id,
          role,
          group:external_groups(id, name)
        `)
        .eq('contact_id', id);

      if (groupsError) throw groupsError;

      setSelectedGroups(
        (groupsData || []).map((g: any) => ({
          groupId: g.group.id,
          groupName: g.group.name,
          role: g.role || '',
        }))
      );
    } catch (error) {
      console.error('Erreur lors de la récupération du contact:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les informations du contact.',
        variant: 'destructive',
      });
      navigate(Routes.ADMIN_EXTERNAL_CONTACTS);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Le fichier doit être une image.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erreur',
        description: 'L\'image ne doit pas dépasser 5 MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `contacts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('external-directory')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('external-directory')
        .getPublicUrl(filePath);

      setFormData({ ...formData, photo_url: publicUrl });
      
      toast({
        title: 'Image téléchargée',
        description: 'La photo a été téléchargée avec succès.',
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger l\'image.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, photo_url: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name?.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le prénom est requis.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      let contactId = id;

      if (id) {
        // Mise à jour
        const updateData: ExternalContactUpdate = {
          first_name: formData.first_name,
          last_name: formData.last_name || null,
          photo_url: formData.photo_url || null,
          email: formData.email || null,
          phone: formData.phone || null,
          city: formData.city || null,
          note: formData.note || null,
          tags: formData.tags || [],
        };

        const { error } = await supabase
          .from('external_contacts')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;
      } else {
        // Création
        const insertData: ExternalContactInsert = {
          first_name: formData.first_name,
          last_name: formData.last_name || null,
          photo_url: formData.photo_url || null,
          email: formData.email || null,
          phone: formData.phone || null,
          city: formData.city || null,
          note: formData.note || null,
          tags: formData.tags || [],
        };

        const { data, error } = await supabase
          .from('external_contacts')
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        contactId = data.id;
      }

      // Gérer les groupes
      if (contactId) {
        // Supprimer les anciennes associations
        await supabase
          .from('external_contact_groups')
          .delete()
          .eq('contact_id', contactId);

        // Ajouter les nouvelles associations
        if (selectedGroups.length > 0) {
          const groupInserts = selectedGroups.map(g => ({
            contact_id: contactId!,
            group_id: g.groupId,
            role: g.role || null,
          }));

          const { error: groupError } = await supabase
            .from('external_contact_groups')
            .insert(groupInserts);

          if (groupError) throw groupError;
        }
      }

      toast({
        title: id ? 'Contact mis à jour' : 'Contact créé',
        description: id 
          ? 'Le contact a été mis à jour avec succès.'
          : 'Le contact a été créé avec succès.',
      });

      navigate(Routes.ADMIN_EXTERNAL_CONTACTS);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le contact.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-getigne-accent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>{id ? 'Modifier' : 'Nouveau'} contact externe | Admin</title>
      </Helmet>

      <AdminLayout>
        <div className="py-8 max-w-3xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(Routes.ADMIN_EXTERNAL_CONTACTS)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux contacts
            </Button>
            <h1 className="text-2xl font-bold">
              {id ? 'Modifier le contact' : 'Nouveau contact'}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name || ''}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Jean"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name || ''}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Dupont"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Photo</Label>
                  {formData.photo_url ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={formData.photo_url}
                        alt="Photo"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveImage}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Retirer
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="flex-1"
                      />
                      {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Format: JPG, PNG. Taille max: 5 MB
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coordonnées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jean.dupont@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ville/Commune</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Gétigné"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Note</Label>
                  <Textarea
                    id="note"
                    value={formData.note || ''}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Informations complémentaires..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Catégorisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Étiquettes</Label>
                  <TagsInput
                    value={formData.tags || []}
                    onChange={(tags) => setFormData({ ...formData, tags })}
                    suggestions={allTags}
                    placeholder="Ajouter une étiquette..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Groupes associés</Label>
                  <GroupSelector
                    value={selectedGroups}
                    onChange={setSelectedGroups}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(Routes.ADMIN_EXTERNAL_CONTACTS)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
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
          </form>
        </div>
      </AdminLayout>
    </HelmetProvider>
  );
};

export default AdminExternalContactFormPage;

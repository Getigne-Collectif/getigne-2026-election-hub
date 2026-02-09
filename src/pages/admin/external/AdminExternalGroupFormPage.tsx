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
import { Loader2, Save, ArrowLeft, Upload, X } from 'lucide-react';
import { Routes } from '@/routes';
import TagsInput from '@/components/admin/external/TagsInput';
import type { ExternalGroup, ExternalGroupInsert, ExternalGroupUpdate } from '@/types/external-directory.types';

const AdminExternalGroupFormPage = () => {
  const { id } = useParams();
  const { isAdmin, authChecked, isRefreshingRoles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<Partial<ExternalGroup>>({
    name: '',
    logo_url: '',
    description: '',
    contact_email: '',
    city: '',
    tags: [],
  });

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
      fetchGroup();
    }
  }, [id, authChecked, isAdmin, navigate, toast, isRefreshingRoles]);

  const fetchAllTags = async () => {
    try {
      const { data, error } = await supabase
        .from('external_groups')
        .select('tags');

      if (error) throw error;
      
      // Extraire tous les tags uniques
      const tagsSet = new Set<string>();
      data?.forEach(item => {
        item.tags?.forEach(tag => tagsSet.add(tag));
      });
      
      setAllTags(Array.from(tagsSet).sort());
    } catch (error) {
      console.error('Erreur lors de la récupération des tags:', error);
    }
  };

  const fetchGroup = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('external_groups')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setFormData(data);
    } catch (error) {
      console.error('Erreur lors de la récupération du groupe:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les informations du groupe.',
        variant: 'destructive',
      });
      navigate(`${Routes.ADMIN_EXTERNAL_DIRECTORY}?tab=groups`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Le fichier doit être une image.',
        variant: 'destructive',
      });
      return;
    }

    // Vérifier la taille (max 5MB)
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
      const filePath = `groups/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('external-directory')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('external-directory')
        .getPublicUrl(filePath);

      setFormData({ ...formData, logo_url: publicUrl });
      
      toast({
        title: 'Image téléchargée',
        description: 'Le logo a été téléchargé avec succès.',
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
    setFormData({ ...formData, logo_url: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du groupe est requis.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (id) {
        // Mise à jour
        const updateData: ExternalGroupUpdate = {
          name: formData.name,
          logo_url: formData.logo_url || null,
          description: formData.description || null,
          contact_email: formData.contact_email || null,
          city: formData.city || null,
          tags: formData.tags || [],
        };

        const { error } = await supabase
          .from('external_groups')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Groupe mis à jour',
          description: 'Le groupe a été mis à jour avec succès.',
        });
      } else {
        // Création
        const insertData: ExternalGroupInsert = {
          name: formData.name,
          logo_url: formData.logo_url || null,
          description: formData.description || null,
          contact_email: formData.contact_email || null,
          city: formData.city || null,
          tags: formData.tags || [],
        };

        const { error } = await supabase
          .from('external_groups')
          .insert(insertData);

        if (error) throw error;

        toast({
          title: 'Groupe créé',
          description: 'Le groupe a été créé avec succès.',
        });
      }

      navigate(`${Routes.ADMIN_EXTERNAL_DIRECTORY}?tab=groups`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le groupe.',
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
        <title>{id ? 'Modifier' : 'Nouveau'} groupe externe | Admin</title>
      </Helmet>

      <AdminLayout>
        <div className="py-8 max-w-3xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(`${Routes.ADMIN_EXTERNAL_DIRECTORY}?tab=groups`)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux groupes
            </Button>
            <h1 className="text-2xl font-bold">
              {id ? 'Modifier le groupe' : 'Nouveau groupe'}
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Informations du groupe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Nom */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du groupe *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: Club d'échecs"
                    required
                  />
                </div>

                {/* Logo */}
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo</Label>
                  {formData.logo_url ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={formData.logo_url}
                        alt="Logo"
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
                        id="logo"
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

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez le groupe et ses activités..."
                    rows={4}
                  />
                </div>

                {/* Email de contact */}
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email de contact</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email || ''}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="contact@groupe.fr"
                  />
                </div>

                {/* Ville */}
                <div className="space-y-2">
                  <Label htmlFor="city">Ville/Commune</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Gétigné"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Étiquettes</Label>
                  <TagsInput
                    value={formData.tags || []}
                    onChange={(tags) => setFormData({ ...formData, tags })}
                    suggestions={allTags}
                    placeholder="Ajouter une étiquette..."
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`${Routes.ADMIN_EXTERNAL_DIRECTORY}?tab=groups`)}
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

export default AdminExternalGroupFormPage;

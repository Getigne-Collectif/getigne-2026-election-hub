
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/auth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Star } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/dynamic-icon';

const ICON_OPTIONS = [
  'Car', 'Users', 'Home', 'Calendar', 'MessageCircle', 'Settings', 
  'Heart', 'Book', 'Camera', 'Music', 'MapPin', 'Phone', 'Mail',
  'Globe', 'Shield', 'Zap', 'Coffee', 'Gamepad2', 'Palette'
];

const AdminGalaxyEditorPage = () => {
  const { isAdmin, authChecked } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    baseline: '',
    link: '',
    icon: 'Star',
    color: '#22c55e',
    is_external: false,
    status: 'active'
  });

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

    if (isEditing && id) {
      fetchItem(id);
    }
  }, [authChecked, isAdmin, navigate, toast, isEditing, id]);

  const fetchItem = async (itemId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('galaxy_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name,
          baseline: data.baseline,
          link: data.link,
          icon: data.icon,
          color: data.color || '#22c55e',
          is_external: data.is_external,
          status: data.status
        });
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer l\'élément.',
        variant: 'destructive',
      });
      navigate('/admin/galaxy');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditing && id) {
        const { error } = await supabase
          .from('galaxy_items')
          .update({
            name: formData.name,
            baseline: formData.baseline,
            link: formData.link,
            icon: formData.icon,
            color: formData.color,
            is_external: formData.is_external,
            status: formData.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        // Pour un nouvel élément, on trouve la prochaine position
        const { data: existingItems } = await supabase
          .from('galaxy_items')
          .select('position')
          .order('position', { ascending: false })
          .limit(1);

        const nextPosition = existingItems && existingItems.length > 0 
          ? existingItems[0].position + 1 
          : 1;

        const { error } = await supabase
          .from('galaxy_items')
          .insert({
            name: formData.name,
            baseline: formData.baseline,
            link: formData.link,
            icon: formData.icon,
            color: formData.color,
            is_external: formData.is_external,
            status: formData.status,
            position: nextPosition
          });

        if (error) throw error;
      }

      toast({
        title: 'Succès',
        description: `L'élément a été ${isEditing ? 'modifié' : 'créé'} avec succès.`,
      });

      navigate('/admin/galaxy');
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de ${isEditing ? 'modifier' : 'créer'} l'élément.`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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
        <title>{isEditing ? 'Modifier' : 'Créer'} un élément Galaxy - Administration</title>
      </Helmet>

      <AdminLayout>
        <div className="py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/galaxy')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Star className="w-6 h-6 text-getigne-green-500" />
                {isEditing ? 'Modifier' : 'Créer'} un élément Galaxy
              </h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informations de l'élément</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Lift"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="baseline">Baseline *</Label>
                    <Input
                      id="baseline"
                      value={formData.baseline}
                      onChange={(e) => setFormData({ ...formData, baseline: e.target.value })}
                      placeholder="Ex: Covoiturage solidaire"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="link">Lien *</Label>
                    <Input
                      id="link"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="Ex: /lift ou https://example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon">Icône *</Label>
                    <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                      <SelectTrigger>
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <DynamicIcon name={formData.icon} size={16} />
                            {formData.icon}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            <div className="flex items-center gap-2">
                              <DynamicIcon name={icon} size={16} />
                              {icon}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Couleur</Label>
                    <div className="flex items-center gap-2">
                      <input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="#22c55e"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Statut</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="inactive">Inactif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_external"
                    checked={formData.is_external}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_external: checked })}
                  />
                  <Label htmlFor="is_external">Lien externe</Label>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Aperçu</h3>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg max-w-md">
                    <div 
                      className="p-2 text-white rounded-lg"
                      style={{ backgroundColor: formData.color }}
                    >
                      <DynamicIcon name={formData.icon} size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{formData.name || 'Nom'}</div>
                      <div className="text-xs text-gray-500">{formData.baseline || 'Baseline'}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin/galaxy')}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-getigne-green-500 hover:bg-getigne-green-600"
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isEditing ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </HelmetProvider>
  );
};

export default AdminGalaxyEditorPage;

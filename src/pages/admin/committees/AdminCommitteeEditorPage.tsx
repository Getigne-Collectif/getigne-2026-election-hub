
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/components/admin/AdminLayout';
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function AdminCommitteeEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('users'); // Default icon
  const [teamPhotoUrl, setTeamPhotoUrl] = useState('');

  // Fetch committee data if in edit mode
  useEffect(() => {
    const fetchCommittee = async () => {
      if (!isEditMode) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('citizen_committees')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        setTitle(data.title);
        setDescription(data.description);
        setIcon(data.icon);
        if (data.team_photo_url) {
          setTeamPhotoUrl(data.team_photo_url);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la commission:', error);
        toast.error("Impossible de charger les données de la commission");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCommittee();
  }, [id, isEditMode]);

  // Save committee
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const committeeData = {
        title,
        description,
        icon,
        team_photo_url: teamPhotoUrl || null
      };
      
      let result;
      
      if (isEditMode) {
        // Update existing committee
        result = await supabase
          .from('citizen_committees')
          .update(committeeData)
          .eq('id', id);
      } else {
        // Create new committee
        result = await supabase
          .from('citizen_committees')
          .insert({ ...committeeData, id: uuidv4() });
      }
      
      if (result.error) throw result.error;
      
      toast.success(isEditMode 
        ? "Commission mise à jour avec succès" 
        : "Commission créée avec succès"
      );
      
      navigate('/admin/committees');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la commission:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout
      breadcrumb={
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/committees">Commissions</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>
              {isEditMode ? 'Modifier' : 'Créer'}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </>
      }
      title={isEditMode ? "Modifier la commission" : "Créer une commission"}
      description={isEditMode 
        ? "Modifiez les détails de la commission"
        : "Créez une nouvelle commission citoyenne"
      }
    >
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de la commission</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Commission environnement"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez le rôle et les objectifs de cette commission"
                  rows={5}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="icon">Icône (nom de l'icône Lucide)</Label>
                <Input
                  id="icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="Ex: users, leaf, home..."
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Utilisez un nom d'icône de la bibliothèque Lucide.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teamPhotoUrl">URL de la photo d'équipe (optionnel)</Label>
                <Input
                  id="teamPhotoUrl"
                  value={teamPhotoUrl}
                  onChange={(e) => setTeamPhotoUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/admin/committees')}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Enregistrement...' : isEditMode ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

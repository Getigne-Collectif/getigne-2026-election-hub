import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
type Committee = {
  id: string;
  title: string;
  description: string;
  icon: string;
  team_photo_url?: string | null;
  cover_photo_url?: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

// Couleurs disponibles
const AVAILABLE_COLORS = [
  { name: 'Vert', value: 'bg-green-500' },
  { name: 'Bleu', value: 'bg-blue-500' },
  { name: 'Rouge', value: 'bg-red-500' },
  { name: 'Jaune', value: 'bg-yellow-500' },
  { name: 'Violet', value: 'bg-purple-500' },
  { name: 'Rose', value: 'bg-pink-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Cyan', value: 'bg-cyan-500' },
  { name: 'Teal', value: 'bg-teal-500' }
];

interface CommitteeDetailsFormProps {
  isEditMode: boolean;
  committeeId?: string;
  initialData?: Committee | null;
  isLoading?: boolean;
}

export default function CommitteeDetailsForm({
  isEditMode,
  committeeId,
  initialData,
  isLoading = false
}: CommitteeDetailsFormProps) {
  const navigate = useNavigate();
  
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('users');
  const [teamPhotoUrl, setTeamPhotoUrl] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [color, setColor] = useState(AVAILABLE_COLORS[0].value);
  
  const [teamPhotoFile, setTeamPhotoFile] = useState<File | null>(null);
  const [teamPhotoPreview, setTeamPhotoPreview] = useState<string | null>(null);
  
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [dataInitialized, setDataInitialized] = useState(false);

  useEffect(() => {
    if (initialData && !dataInitialized) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setIcon(initialData.icon || 'users');
      setTeamPhotoUrl(initialData.team_photo_url || null);
      setCoverPhotoUrl(initialData.cover_photo_url || null);
      setColor(initialData.color || AVAILABLE_COLORS[0].value);
      
      if (initialData.team_photo_url) {
        setTeamPhotoPreview(initialData.team_photo_url);
      }
      
      if (initialData.cover_photo_url) {
        setCoverPhotoPreview(initialData.cover_photo_url);
      }
      
      setDataInitialized(true);
    }
  }, [initialData, dataInitialized]);

  const handleTeamPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setTeamPhotoFile(null);
      setTeamPhotoPreview(null);
      return;
    }

    const file = e.target.files[0];
    setTeamPhotoFile(file);
    
    const objectUrl = URL.createObjectURL(file);
    setTeamPhotoPreview(objectUrl);
  };

  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setCoverPhotoFile(null);
      setCoverPhotoPreview(null);
      return;
    }

    const file = e.target.files[0];
    setCoverPhotoFile(file);
    
    const objectUrl = URL.createObjectURL(file);
    setCoverPhotoPreview(objectUrl);
  };

  const uploadPhoto = async (file: File, bucketFolder: string): Promise<string | null> => {
    if (!file) return null;

    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${bucketFolder}/${fileName}`;

      const bucketName = 'public';
      
      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error(`Erreur lors de l'upload de l'image:`, error);
      toast.error("Erreur lors de l'upload de l'image");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      let teamPhotoUrlFinal = teamPhotoUrl;
      let coverPhotoUrlFinal = coverPhotoUrl;
      
      if (teamPhotoFile) {
        const uploadedTeamUrl = await uploadPhoto(teamPhotoFile, 'teams');
        if (uploadedTeamUrl) {
          teamPhotoUrlFinal = uploadedTeamUrl;
        }
      }
      
      if (coverPhotoFile) {
        const uploadedCoverUrl = await uploadPhoto(coverPhotoFile, 'covers');
        if (uploadedCoverUrl) {
          coverPhotoUrlFinal = uploadedCoverUrl;
        }
      }
      
      const committeeData = {
        title,
        description,
        icon,
        team_photo_url: teamPhotoUrlFinal || null,
        cover_photo_url: coverPhotoUrlFinal || null,
        color
      };
      
      
      let finalCommitteeId = committeeId;
      
      if (isEditMode && committeeId) {
        
        const { error, data } = await supabase
          .from('citizen_committees')
          .update(committeeData)
          .eq('id', committeeId)
          .select();
          
        if (error) {
          console.error("Update error:", error);
          throw error;
        }
        
      } else {
        finalCommitteeId = uuidv4();
        
        const { error, data } = await supabase
          .from('citizen_committees')
          .insert({ 
            ...committeeData, 
            id: finalCommitteeId 
          })
          .select();
          
        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
        
      }
      
      toast.success(isEditMode 
        ? "Commission mise à jour avec succès" 
        : "Commission créée avec succès"
      );
      
      navigate('/admin/committees');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la commission:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Chargement des données...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations sur la commission</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="color">Couleur</Label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez une couleur" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_COLORS.map((colorOption) => (
                      <SelectItem key={colorOption.value} value={colorOption.value} className="flex items-center">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${colorOption.value}`}></div>
                          <span>{colorOption.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Photo d'équipe */}
            <div className="space-y-2">
              <Label>Photo d'équipe</Label>
              <div className="flex flex-col items-center mt-2">
                {teamPhotoPreview && (
                  <div className="mb-4 relative">
                    <img 
                      src={teamPhotoPreview} 
                      alt="Aperçu" 
                      className="w-64 h-48 object-cover rounded-lg shadow-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => {
                        setTeamPhotoFile(null);
                        setTeamPhotoPreview(null);
                        setTeamPhotoUrl('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="teamPhotoUpload" className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <UploadCloud className="h-8 w-8 text-gray-400" />
                      <p className="mt-1 text-sm text-gray-500">Cliquez pour sélectionner une image d'équipe</p>
                    </div>
                    <input
                      type="file"
                      id="teamPhotoUpload"
                      accept="image/*"
                      onChange={handleTeamPhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
            
            {/* Photo de couverture */}
            <div className="space-y-2">
              <Label>Photo de couverture</Label>
              <div className="flex flex-col items-center mt-2">
                {coverPhotoPreview && (
                  <div className="mb-4 relative">
                    <img 
                      src={coverPhotoPreview} 
                      alt="Aperçu couverture" 
                      className="w-full h-48 object-cover rounded-lg shadow-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => {
                        setCoverPhotoFile(null);
                        setCoverPhotoPreview(null);
                        setCoverPhotoUrl('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="coverPhotoUpload" className="cursor-pointer w-full">
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <UploadCloud className="h-8 w-8 text-gray-400" />
                      <p className="mt-1 text-sm text-gray-500">Cliquez pour sélectionner une image de couverture</p>
                    </div>
                    <input
                      type="file"
                      id="coverPhotoUpload"
                      accept="image/*"
                      onChange={handleCoverPhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/admin/committees')}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving || isUploading}
            >
              {(isSaving || isUploading) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : isEditMode ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

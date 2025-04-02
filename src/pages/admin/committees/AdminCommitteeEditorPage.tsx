
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/components/admin/AdminLayout';
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, PlusCircle, Trash2, UploadCloud, User, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

// Types pour la commission et les membres
type Committee = {
  id: string;
  title: string;
  description: string;
  icon: string;
  team_photo_url?: string | null;
  color?: string | null;
  created_at: string;
  updated_at: string;
}

type Member = {
  id: string;
  name: string;
  role: string;
  photo: string;
  user_id?: string | null;
}

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
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

export default function AdminCommitteeEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('users'); // Default icon
  const [teamPhotoUrl, setTeamPhotoUrl] = useState('');
  const [color, setColor] = useState(AVAILABLE_COLORS[0].value);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // État pour les membres de la commission
  const [members, setMembers] = useState<Member[]>([]);
  const [userProfiles, setUserProfiles] = useState<Profile[]>([]);
  
  // État pour le modal d'ajout de membre
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('membre');
  const [memberPhoto, setMemberPhoto] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [linkToUser, setLinkToUser] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

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
        setColor(data.color || AVAILABLE_COLORS[0].value);
        
        if (data.team_photo_url) {
          setTeamPhotoUrl(data.team_photo_url);
          setPhotoPreview(data.team_photo_url);
        }
        
        // Charger les membres de la commission
        await fetchCommitteeMembers();
        
      } catch (error) {
        console.error('Erreur lors du chargement de la commission:', error);
        toast.error("Impossible de charger les données de la commission");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .order('last_name');
        
        if (error) throw error;
        setUserProfiles(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      }
    };
    
    fetchCommittee();
    fetchProfiles();
  }, [id, isEditMode]);

  // Charger les membres de la commission
  const fetchCommitteeMembers = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('committee_members')
        .select('*')
        .eq('committee_id', id)
        .order('role', { ascending: false });
      
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
    }
  };

  // Gérer l'upload d'image
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    const file = e.target.files[0];
    setPhotoFile(file);
    
    // Créer une URL pour l'aperçu
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  // Upload de la photo vers Supabase Storage
  const uploadPhoto = async () => {
    if (!photoFile) return null;

    setIsUploading(true);
    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `committee-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
      toast.error("Erreur lors de l'upload de l'image");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Save committee
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Upload de l'image si une nouvelle a été sélectionnée
      let photoUrl = teamPhotoUrl;
      if (photoFile) {
        const uploadedUrl = await uploadPhoto();
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }
      
      const committeeData = {
        title,
        description,
        icon,
        team_photo_url: photoUrl || null,
        color
      };
      
      let committeeId = id;
      
      if (isEditMode) {
        // Update existing committee
        const { error } = await supabase
          .from('citizen_committees')
          .update(committeeData)
          .eq('id', id);
          
        if (error) throw error;
      } else {
        // Create new committee
        committeeId = uuidv4();
        const { error } = await supabase
          .from('citizen_committees')
          .insert({ ...committeeData, id: committeeId });
          
        if (error) throw error;
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
      setIsLoading(false);
    }
  };

  // Ajouter un membre
  const handleAddMember = async () => {
    if (!id) {
      toast.error("Veuillez d'abord enregistrer la commission pour pouvoir ajouter des membres");
      return;
    }

    try {
      const memberData = {
        committee_id: id,
        name: memberName,
        role: memberRole,
        photo: memberPhoto || 'placeholder.svg', // Use placeholder if no photo URL
        user_id: linkToUser ? selectedUserId : null
      };

      const { error } = await supabase
        .from('committee_members')
        .insert({ ...memberData, id: uuidv4() });

      if (error) throw error;

      toast.success("Membre ajouté avec succès");
      setIsAddMemberDialogOpen(false);
      
      // Reset form
      setMemberName('');
      setMemberRole('membre');
      setMemberPhoto('');
      setSelectedUserId('');
      setLinkToUser(false);
      
      // Recharger les membres
      await fetchCommitteeMembers();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre:', error);
      toast.error("Erreur lors de l'ajout du membre");
    }
  };

  // Supprimer un membre
  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      const { error } = await supabase
        .from('committee_members')
        .delete()
        .eq('id', memberToDelete);

      if (error) throw error;

      toast.success("Membre supprimé avec succès");
      setMemberToDelete(null);
      await fetchCommitteeMembers();
    } catch (error) {
      console.error('Erreur lors de la suppression du membre:', error);
      toast.error("Erreur lors de la suppression du membre");
    }
  };

  // Handle user selection
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    
    // Automatically fill name from selected user
    const selectedUser = userProfiles.find(profile => profile.id === userId);
    if (selectedUser) {
      setMemberName(`${selectedUser.first_name} ${selectedUser.last_name}`);
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
        ? "Modifiez les détails de la commission et gérez ses membres"
        : "Créez une nouvelle commission citoyenne"
      }
    >
      <div className="max-w-3xl mx-auto mb-10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="details" className="flex-1">Détails</TabsTrigger>
            {isEditMode && <TabsTrigger value="members" className="flex-1">Membres</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="details">
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
                    
                    <div className="space-y-2">
                      <Label>Photo d'équipe</Label>
                      <div className="flex flex-col items-center mt-2">
                        {photoPreview && (
                          <div className="mb-4 relative">
                            <img 
                              src={photoPreview} 
                              alt="Aperçu" 
                              className="w-64 h-48 object-cover rounded-lg shadow-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => {
                                setPhotoFile(null);
                                setPhotoPreview(null);
                                setTeamPhotoUrl('');
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <div className="flex items-center justify-center w-full">
                          <label htmlFor="photoUpload" className="cursor-pointer">
                            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                              <UploadCloud className="h-8 w-8 text-gray-400" />
                              <p className="mt-1 text-sm text-gray-500">Cliquez pour sélectionner une image</p>
                            </div>
                            <input
                              type="file"
                              id="photoUpload"
                              accept="image/*"
                              onChange={handlePhotoChange}
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
                      disabled={isLoading || isUploading}
                    >
                      {(isLoading || isUploading) ? 'Enregistrement...' : isEditMode ? 'Mettre à jour' : 'Créer'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="members">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Membres de la commission</CardTitle>
                <Button 
                  onClick={() => setIsAddMemberDialogOpen(true)} 
                  size="sm" 
                  className="ml-auto"
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Ajouter un membre
                </Button>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="text-center p-10 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto opacity-30 mb-2" />
                    <p>Aucun membre dans cette commission.</p>
                    <p className="text-sm">Cliquez sur "Ajouter un membre" pour commencer.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {members.map(member => (
                      <div key={member.id} className="flex items-center gap-3 border p-3 rounded-md">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={member.photo === 'placeholder.svg' ? '/placeholder.svg' : member.photo}
                            alt={member.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                          {member.user_id && (
                            <div className="flex items-center text-xs text-green-600 mt-1">
                              <Check className="h-3 w-3 mr-1" />
                              Utilisateur lié
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="flex-shrink-0 text-destructive hover:text-destructive"
                          onClick={() => setMemberToDelete(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Alert Dialog pour confirmer la suppression d'un membre */}
      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Ce membre sera définitivement retiré de cette commission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Dialog pour ajouter un membre */}
      <AlertDialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Ajouter un membre</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2 mb-4">
              <Label htmlFor="linkToUser" className="flex items-center cursor-pointer">
                <input
                  id="linkToUser"
                  type="checkbox"
                  checked={linkToUser}
                  onChange={(e) => setLinkToUser(e.target.checked)}
                  className="mr-2"
                />
                Associer à un compte utilisateur
              </Label>
            </div>

            {linkToUser && (
              <div className="space-y-2">
                <Label htmlFor="userId">Utilisateur</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={handleUserSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {userProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name} {profile.last_name} {profile.email ? `(${profile.email})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="memberName">Nom complet</Label>
              <Input
                id="memberName"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Prénom Nom"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberRole">Rôle</Label>
              <Select
                value={memberRole}
                onValueChange={setMemberRole}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pilote">Pilote</SelectItem>
                  <SelectItem value="membre">Membre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberPhoto">URL de la photo</Label>
              <Input
                id="memberPhoto"
                value={memberPhoto}
                onChange={(e) => setMemberPhoto(e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Si non spécifié, une image par défaut sera utilisée.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddMember}>
              Ajouter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

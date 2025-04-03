
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check, PlusCircle, Trash2, UploadCloud, User, X } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface CommitteeMembersProps {
  committeeId: string;
  defaultMembers?: Member[];
}

export default function CommitteeMembersManagement({ committeeId, defaultMembers = [] }: CommitteeMembersProps) {
  const navigate = useNavigate();
  
  const [members, setMembers] = useState<Member[]>(defaultMembers);
  const [userProfiles, setUserProfiles] = useState<Profile[]>([]);
  
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('membre');
  const [memberPhotoFile, setMemberPhotoFile] = useState<File | null>(null);
  const [memberPhotoPreview, setMemberPhotoPreview] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [linkToUser, setLinkToUser] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  // Fetch committee members and profiles
  useState(() => {
    const fetchCommitteeMembers = async () => {
      if (!committeeId) return;

      try {
        const { data, error } = await supabase
          .from('committee_members')
          .select('*')
          .eq('committee_id', committeeId)
          .order('role', { ascending: false });
        
        if (error) throw error;
        setMembers(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des membres:', error);
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
    
    fetchCommitteeMembers();
    fetchProfiles();
  }, [committeeId]);

  const handleMemberPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setMemberPhotoFile(null);
      setMemberPhotoPreview(null);
      return;
    }

    const file = e.target.files[0];
    setMemberPhotoFile(file);
    
    const objectUrl = URL.createObjectURL(file);
    setMemberPhotoPreview(objectUrl);
  };

  const uploadMemberPhoto = async (file: File): Promise<string | null> => {
    if (!file) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `members/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'avatar du membre:', error);
      toast.error("Erreur lors de l'upload de l'avatar du membre");
      return null;
    }
  };

  const handleAddMember = async () => {
    if (!committeeId) {
      toast.error("Veuillez d'abord enregistrer la commission pour pouvoir ajouter des membres");
      return;
    }

    try {
      // Si lié à un utilisateur, on utilise seulement l'ID utilisateur
      // Sinon, on utilise les données saisies manuellement
      let photoUrl = 'placeholder.svg';
      
      // Si un fichier photo a été sélectionné, on l'upload
      if (memberPhotoFile) {
        const uploadedUrl = await uploadMemberPhoto(memberPhotoFile);
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }

      const memberData = {
        committee_id: committeeId,
        name: linkToUser ? 
          // Si lié à un utilisateur, on récupère le nom complet du profil
          userProfiles.find(p => p.id === selectedUserId)?.first_name + ' ' + 
          userProfiles.find(p => p.id === selectedUserId)?.last_name : 
          memberName,
        role: memberRole,
        photo: photoUrl,
        user_id: linkToUser ? selectedUserId : null
      };

      const { error } = await supabase
        .from('committee_members')
        .insert({ ...memberData, id: uuidv4() });

      if (error) throw error;

      toast.success("Membre ajouté avec succès");
      setIsAddMemberDialogOpen(false);
      
      // Réinitialiser les champs
      setMemberName('');
      setMemberRole('membre');
      setMemberPhotoFile(null);
      setMemberPhotoPreview(null);
      setSelectedUserId('');
      setLinkToUser(false);
      
      // Update the members list
      const { data } = await supabase
        .from('committee_members')
        .select('*')
        .eq('committee_id', committeeId)
        .order('role', { ascending: false });
      
      if (data) {
        setMembers(data);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre:', error);
      toast.error("Erreur lors de l'ajout du membre");
    }
  };

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
      
      // Update the members list
      const { data } = await supabase
        .from('committee_members')
        .select('*')
        .eq('committee_id', committeeId)
        .order('role', { ascending: false });
      
      if (data) {
        setMembers(data);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du membre:', error);
      toast.error("Erreur lors de la suppression du membre");
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
  };

  return (
    <>
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
            
            {!linkToUser && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="memberName">Nom complet</Label>
                  <Input
                    id="memberName"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Prénom Nom"
                    required={!linkToUser}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Photo du membre</Label>
                  <div className="flex flex-col items-center mt-2">
                    {memberPhotoPreview && (
                      <div className="mb-4 relative">
                        <img 
                          src={memberPhotoPreview} 
                          alt="Aperçu avatar" 
                          className="w-24 h-24 object-cover rounded-full"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-0 right-0 h-5 w-5"
                          onClick={() => {
                            setMemberPhotoFile(null);
                            setMemberPhotoPreview(null);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="memberPhotoUpload" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          <UploadCloud className="h-6 w-6 text-gray-400" />
                          <p className="mt-1 text-xs text-gray-500">Sélectionner une photo</p>
                        </div>
                        <input
                          type="file"
                          id="memberPhotoUpload"
                          accept="image/*"
                          onChange={handleMemberPhotoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}

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
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddMember}>
              Ajouter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Edit, Trash2, UploadCloud, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

type CommitteeMember = {
  id: string;
  name: string;
  role: string;
  photo: string;
  user_id?: string | null;
};

interface CommitteeMembersProps {
  committeeId: string;
  simplified?: boolean;
}

const CommitteeMembers = ({ committeeId, simplified = false }: CommitteeMembersProps) => {
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [memberPhotoFile, setMemberPhotoFile] = useState<File | null>(null);
  const [memberPhotoPreview, setMemberPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('committee_members')
          .select('*')
          .eq('committee_id', committeeId)
          .order('role', { ascending: false });
        
        if (error) throw error;
        
        setMembers(data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des membres:', error);
        setError('Impossible de charger les membres de la commission');
        setLoading(false);
      }
    };

    fetchMembers();
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

    setIsUploading(true);
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
      console.error('Erreur lors de l\'upload de l\'avatar:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger l'avatar"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditMember = async () => {
    if (!editingMember) return;

    try {
      let photoUrl = editingMember.photo;
      
      if (memberPhotoFile) {
        const uploadedUrl = await uploadMemberPhoto(memberPhotoFile);
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }

      const { error } = await supabase
        .from('committee_members')
        .update({ 
          name: editingMember.name, 
          role: editingMember.role,
          photo: photoUrl
        })
        .eq('id', editingMember.id);

      if (error) throw error;

      setMembers(members.map(m => 
        m.id === editingMember.id ? {...editingMember, photo: photoUrl} : m
      ));

      toast({
        title: 'Membre mis à jour',
        description: 'Les informations du membre ont été modifiées avec succès.',
      });

      // Réinitialiser les états
      setEditingMember(null);
      setMemberPhotoFile(null);
      setMemberPhotoPreview(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du membre:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le membre.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('committee_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers(members.filter(m => m.id !== memberId));

      toast({
        title: 'Membre supprimé',
        description: 'Le membre a été retiré de la commission.',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du membre:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le membre.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    // Initialiser la prévisualisation de la photo si on est en mode édition
    if (editingMember?.photo && editingMember.photo !== 'placeholder.svg') {
      setMemberPhotoPreview(editingMember.photo);
    } else {
      setMemberPhotoPreview(null);
    }
  }, [editingMember]);

  if (loading) {
    return <div className="py-2">Chargement des membres...</div>;
  }

  if (error) {
    return <div className="py-2 text-red-500">{error}</div>;
  }

  if (simplified) {
    const pilots = members.filter(member => member.role === 'pilote');
    const memberCount = members.length - pilots.length;
    
    return (
      <div className="flex flex-col space-y-2">
        {pilots.length > 0 && (
          <div>
            <div className="text-sm text-getigne-500 mb-1">
              {pilots.length > 1 ? 'Pilotes' : 'Pilote'}:
            </div>
            <div className="flex flex-wrap gap-2">
              {pilots.map(pilot => (
                <div key={pilot.id} className="flex items-center">
                  <Avatar className="w-6 h-6 mr-2">
                    {pilot.photo && pilot.photo !== 'placeholder.svg' ? (
                      <AvatarImage src={pilot.photo} alt={pilot.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-getigne-100">
                        <User className="text-getigne-500 w-4 h-4" />
                      </div>
                    )}
                  </Avatar>
                  <span className="text-sm font-medium">{pilot.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-sm text-getigne-500">
          {memberCount} {memberCount > 1 ? 'membres' : 'membre'} au total
        </div>
      </div>
    );
  }

  const pilots = members.filter(member => member.role === 'pilote');
  const regularMembers = members.filter(member => member.role !== 'pilote');

  return (
    <div className="space-y-8">
      {pilots.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium">
              {pilots.length > 1 ? 'Pilotes de la commission' : 'Pilote de la commission'}
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {pilots.map(pilot => (
              <div key={pilot.id} className="flex flex-col items-center text-center relative">
                <Avatar className="w-24 h-24 mb-3 border-2 border-getigne-accent">
                  {pilot.photo && pilot.photo !== 'placeholder.svg' ? (
                    <AvatarImage src={pilot.photo} alt={pilot.name} className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-getigne-100">
                      <User className="text-getigne-500" />
                    </div>
                  )}
                </Avatar>
                <div className="space-y-1">
                  <h4 className="font-medium">{pilot.name}</h4>
                  <Badge className="bg-getigne-accent">Pilote</Badge>
                </div>
                <div className="absolute top-0 right-0 flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8"
                    onClick={() => setEditingMember(pilot)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 text-red-500 hover:bg-red-50"
                    onClick={() => handleDeleteMember(pilot.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {regularMembers.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium">
              {regularMembers.length > 1 ? 'Membres de la commission' : 'Membre de la commission'}
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {regularMembers.map(member => (
              <div key={member.id} className="flex flex-col items-center text-center relative">
                <Avatar className="w-20 h-20 mb-3 border border-getigne-200">
                  {member.photo && member.photo !== 'placeholder.svg' ? (
                    <AvatarImage src={member.photo} alt={member.name} className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-getigne-100">
                      <User className="text-getigne-500" />
                    </div>
                  )}
                </Avatar>
                <div className="space-y-1">
                  <h4 className="font-medium">{member.name}</h4>
                  <Badge variant="outline" className="bg-white">Membre</Badge>
                </div>
                <div className="absolute top-0 right-0 flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8"
                    onClick={() => setEditingMember(member)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 text-red-500 hover:bg-red-50"
                    onClick={() => handleDeleteMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {members.length === 0 && (
        <div className="py-4 text-getigne-700">
          Aucun membre n'est encore associé à cette commission.
        </div>
      )}

      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le membre</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input 
                placeholder="Nom" 
                value={editingMember.name}
                onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
              />
              
              <div>
                <Label>Photo</Label>
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
                          // Si c'était une photo déjà existante, la conserver
                          if (editingMember.photo === memberPhotoPreview) {
                            setMemberPhotoPreview(editingMember.photo);
                          }
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
                        <p className="mt-1 text-xs text-gray-500">
                          {memberPhotoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                        </p>
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
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="rolePilote"
                  checked={editingMember.role === 'pilote'}
                  onChange={() => setEditingMember({...editingMember, role: 'pilote'})}
                  className="mr-2"
                />
                <label htmlFor="rolePilote">Pilote</label>
                
                <input
                  type="radio"
                  id="roleMembre"
                  checked={editingMember.role === 'membre'}
                  onChange={() => setEditingMember({...editingMember, role: 'membre'})}
                  className="ml-4 mr-2"
                />
                <label htmlFor="roleMembre">Membre</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditingMember(null);
                setMemberPhotoFile(null);
                setMemberPhotoPreview(null);
              }}>
                Annuler
              </Button>
              <Button onClick={handleEditMember} disabled={isUploading}>
                {isUploading ? 'Envoi en cours...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export const getMemberCount = async (committeeId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('committee_members')
      .select('*', { count: 'exact', head: true })
      .eq('committee_id', committeeId);
    
    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error('Erreur lors du comptage des membres:', error);
    return 0;
  }
};

export default CommitteeMembers;

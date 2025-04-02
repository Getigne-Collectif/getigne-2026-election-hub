
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Plus, User, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CommitteeMembers from '@/components/CommitteeMembers';
import AdminLayout from '@/components/admin/AdminLayout';
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

type CommitteeData = {
  id: string;
  title: string;
  description: string;
  icon: string;
}

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

export default function AdminCommitteeMembersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [committee, setCommittee] = useState<CommitteeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Form fields for new member
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('membre');
  const [memberPhoto, setMemberPhoto] = useState('');
  const [linkToUser, setLinkToUser] = useState(false);

  // Fetch committee data
  useEffect(() => {
    const fetchCommittee = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('citizen_committees')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setCommittee(data);
      } catch (error) {
        console.error('Erreur lors du chargement de la commission:', error);
        toast.error("Impossible de charger les données de la commission");
        navigate('/admin/committees');
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
  }, [id, navigate]);

  // Add new member
  const handleAddMember = async () => {
    if (!id) return;

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
      setIsAddDialogOpen(false);
      
      // Reset form
      setMemberName('');
      setMemberRole('membre');
      setMemberPhoto('');
      setSelectedUserId('');
      setLinkToUser(false);
      
      // Force refresh of the component to show the new member
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre:', error);
      toast.error("Erreur lors de l'ajout du membre");
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

  if (isLoading) {
    return (
      <AdminLayout
        title="Chargement..."
        description="Merci de patienter"
      >
        <div className="flex justify-center items-center h-32">
          <div className="loading">Chargement...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!committee) {
    return (
      <AdminLayout
        title="Commission non trouvée"
        description="La commission que vous recherchez n'existe pas"
      >
        <div className="flex justify-center mt-8">
          <Button onClick={() => navigate('/admin/committees')}>
            Retour à la liste des commissions
          </Button>
        </div>
      </AdminLayout>
    );
  }

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
            <BreadcrumbLink>Membres</BreadcrumbLink>
          </BreadcrumbItem>
        </>
      }
      title={`Membres de ${committee.title}`}
      description="Gérez les membres de cette commission citoyenne"
    >
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/admin/committees')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux commissions
        </Button>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Liste des membres</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un membre
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <CommitteeMembers committeeId={id || ''} />
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un membre</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau membre à la commission {committee.title}.
            </DialogDescription>
          </DialogHeader>
          
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
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddMember}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

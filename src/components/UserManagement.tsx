
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, UserCheck, Shield, UserX, UserPlus, Inbox, PenTool, RefreshCcw } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from '@/components/ui/use-toast';
import UserMembershipStatus from '@/components/admin/UserMembershipStatus';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface UserManagementProps {
  users: any[];
  invitedUsers: any[];
  loading: boolean;
  onRoleChange: (userId: string, role: 'moderator' | 'admin' | 'program_manager', action: 'add' | 'remove') => Promise<void>;
  onInviteUser: (userData: InviteUserFormValues) => Promise<void>;
  onToggleUserStatus: (userId: string, isActive: boolean) => Promise<void>;
}

const inviteUserSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Veuillez entrer une adresse email valide"),
});

type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

const UserManagement: React.FC<UserManagementProps> = ({ 
  users, 
  invitedUsers,
  loading, 
  onRoleChange,
  onInviteUser,
  onToggleUserStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [resendingInvitation, setResendingInvitation] = useState<string | null>(null);

  const form = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
    },
  });

  const handleInviteUser = async (values: InviteUserFormValues) => {
    try {
      await onInviteUser(values);
      form.reset();
      setIsInviteDialogOpen(false);
      toast({
        title: "Invitation envoyée",
        description: `Une invitation a été envoyée à ${values.email}`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'envoi de l'invitation",
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await onToggleUserStatus(userId, isActive);
      toast({
        title: "Statut modifié",
        description: isActive ? "L'utilisateur a été activé" : "L'utilisateur a été désactivé",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la modification du statut",
        variant: "destructive",
      });
    }
  };

  const resendInvitation = async (invitedUser: any) => {
    setResendingInvitation(invitedUser.id);
    try {
      // Appel à la fonction d'invitation
      const { error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: invitedUser.email,
          first_name: invitedUser.first_name,
          last_name: invitedUser.last_name
        }
      });

      if (error) throw error;

      toast({
        title: "Invitation renvoyée",
        description: `Une nouvelle invitation a été envoyée à ${invitedUser.email}`,
      });
    } catch (error: any) {
      console.error('Erreur lors du renvoi de l\'invitation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du renvoi de l'invitation",
        variant: "destructive",
      });
    } finally {
      setResendingInvitation(null);
    }
  };

  // On ne montre que les invitations en attente dans l'onglet "Invitations"
  const pendingInvitedUsers = invitedUsers.filter(user => user.status === 'invited');

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const filteredInvitedUsers = pendingInvitedUsers.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const openRoleDialog = (user: any) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const hasRole = (user: any, role: string) => {
    return user.roles?.includes(role) || false;
  };

  const handleRoleToggle = async (role: 'moderator' | 'admin' | 'program_manager') => {
    if (!selectedUser) return;
    
    const hasRoleNow = hasRole(selectedUser, role);
    await onRoleChange(
      selectedUser.id, 
      role, 
      hasRoleNow ? 'remove' : 'add'
    );
    
    const updatedRoles = hasRoleNow 
      ? selectedUser.roles.filter((r: string) => r !== role)
      : [...(selectedUser.roles || []), role];
    
    setSelectedUser({
      ...selectedUser,
      roles: updatedRoles
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial || '?';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          onClick={() => setIsInviteDialogOpen(true)}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Inviter un utilisateur
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p>Chargement des utilisateurs...</p>
        </div>
      ) : (
        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Utilisateurs ({filteredUsers.length})
            </TabsTrigger>
            <TabsTrigger value="invited" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Invitations ({filteredInvitedUsers.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-10">
                <p>Aucun utilisateur trouvé.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Avatar</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date d'inscription</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Rôles</TableHead>
                    <TableHead>Adhésion</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          {user.avatar_url ? (
                            <AvatarImage src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} />
                          ) : null}
                          <AvatarFallback>{getInitials(user.first_name, user.last_name)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}` 
                          : 'Utilisateur'}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {user.status === 'disabled' ? (
                          <Badge variant="outline" className="bg-red-100 text-red-800">Désactivé</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-800">Actif</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {hasRole(user, 'admin') && (
                            <Badge className="bg-red-500">Admin</Badge>
                          )}
                          {hasRole(user, 'moderator') && (
                            <Badge className="bg-blue-500">Modérateur</Badge>
                          )}
                          {(!user.roles || user.roles.length === 0) && (
                            <Badge variant="outline">Utilisateur</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <UserMembershipStatus 
                          userId={user.id}
                          isMember={user.is_member === true}
                          onUpdate={() => {/* Cette fonction n'est pas utilisée ici */}}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openRoleDialog(user)}
                          >
                            Gérer les rôles
                          </Button>
                          <Button 
                            variant={user.status === 'disabled' ? "default" : "destructive"}
                            size="sm"
                            onClick={() => handleToggleUserStatus(user.id, user.status === 'disabled')}
                          >
                            {user.status === 'disabled' ? "Activer" : "Désactiver"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          
          <TabsContent value="invited">
            {filteredInvitedUsers.length === 0 ? (
              <div className="text-center py-10">
                <p>Aucune invitation en attente.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date d'invitation</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvitedUsers.map((invited) => (
                    <TableRow key={invited.id}>
                      <TableCell>
                        {invited.first_name && invited.last_name 
                          ? `${invited.first_name} ${invited.last_name}` 
                          : 'Invité'}
                      </TableCell>
                      <TableCell>{invited.email}</TableCell>
                      <TableCell>
                        {new Date(invited.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          En attente
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={resendingInvitation === invited.id}
                          onClick={() => resendInvitation(invited)}
                          className="flex items-center gap-1"
                        >
                          {resendingInvitation === invited.id ? (
                            <>Envoi en cours...</>
                          ) : (
                            <>
                              <RefreshCcw className="h-3 w-3" /> 
                              Renvoyer l'invitation
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gérer les rôles utilisateur</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <p className="mt-2">
                  Utilisateur: {selectedUser.email}
                </p>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  <Label htmlFor="admin-role">Administrateur</Label>
                </div>
                <Switch
                  id="admin-role"
                  checked={hasRole(selectedUser, 'admin')}
                  onCheckedChange={() => handleRoleToggle('admin')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5 text-blue-500" />
                  <Label htmlFor="moderator-role">Modérateur</Label>
                </div>
                <Switch
                  id="moderator-role"
                  checked={hasRole(selectedUser, 'moderator')}
                  onCheckedChange={() => handleRoleToggle('moderator')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PenTool className="h-5 w-5 text-green-500" />
                  <Label htmlFor="program-manager-role">Équipe Programme</Label>
                </div>
                <Switch
                  id="program-manager-role"
                  checked={hasRole(selectedUser, 'program_manager')}
                  onCheckedChange={() => handleRoleToggle('program_manager')}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un utilisateur</DialogTitle>
            <DialogDescription>
              Remplissez le formulaire pour envoyer une invitation par email.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleInviteUser)} className="space-y-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder="Jean" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Dupont" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="jean.dupont@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button type="submit">Envoyer l'invitation</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;

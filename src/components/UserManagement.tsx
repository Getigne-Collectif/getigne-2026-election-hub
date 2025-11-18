
import React, { useState, useEffect } from 'react';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, UserCheck, Shield, UserX, UserPlus, Inbox, PenTool, RefreshCcw, Camera, Trash2, Edit, Save, Loader2 } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface UserManagementProps {
  users: any[];
  invitedUsers: any[];
  loading: boolean;
  onRoleChange: (userId: string, role: 'moderator' | 'admin' | 'program_manager', action: 'add' | 'remove') => Promise<void>;
  onInviteUser: (userData: InviteUserFormValues) => Promise<void>;
  onToggleUserStatus: (userId: string, isActive: boolean) => Promise<void>;
  onUpdateAvatar?: (userId: string, file: File) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onUpdateUser?: (userId: string, userData: UpdateUserFormValues) => Promise<void>;
}

const inviteUserSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Veuillez entrer une adresse email valide"),
});

type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

const updateUserSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  status: z.enum(['active', 'disabled']),
  is_member: z.boolean(),
  roles: z.object({
    admin: z.boolean(),
    moderator: z.boolean(),
    program_manager: z.boolean(),
  }),
});

type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

const UserManagement: React.FC<UserManagementProps> = ({ 
  users, 
  invitedUsers,
  loading, 
  onRoleChange,
  onInviteUser,
  onToggleUserStatus,
  onUpdateAvatar,
  onDeleteUser,
  onUpdateUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("users");
  const [resendingInvitation, setResendingInvitation] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [savingUser, setSavingUser] = useState(false);

  const form = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
    },
  });

  const editForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      status: 'active',
      is_member: false,
      roles: {
        admin: false,
        moderator: false,
        program_manager: false,
      },
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

  const hasRole = (user: any, role: string) => {
    return user.roles?.includes(role) || false;
  };

  const openRoleDialog = (user: any) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const openEditSheet = (user: any) => {
    setSelectedUser(user);
    editForm.reset({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      status: user.status === 'disabled' ? 'disabled' : 'active',
      is_member: user.is_member === true,
      roles: {
        admin: hasRole(user, 'admin'),
        moderator: hasRole(user, 'moderator'),
        program_manager: hasRole(user, 'program_manager'),
      },
    });
    setIsEditSheetOpen(true);
  };

  const handleUpdateUser = async (values: UpdateUserFormValues) => {
    if (!selectedUser || !onUpdateUser) return;
    
    setSavingUser(true);
    try {
      // Mettre à jour les rôles si nécessaire
      const currentRoles = {
        admin: hasRole(selectedUser, 'admin'),
        moderator: hasRole(selectedUser, 'moderator'),
        program_manager: hasRole(selectedUser, 'program_manager'),
      };

      // Comparer et mettre à jour les rôles
      for (const [role, shouldHave] of Object.entries(values.roles)) {
        const roleKey = role as 'admin' | 'moderator' | 'program_manager';
        const currentlyHas = currentRoles[roleKey];
        
        if (shouldHave && !currentlyHas) {
          await onRoleChange(selectedUser.id, roleKey, 'add');
        } else if (!shouldHave && currentlyHas) {
          await onRoleChange(selectedUser.id, roleKey, 'remove');
        }
      }

      // Mettre à jour les autres informations
      await onUpdateUser(selectedUser.id, values);
      
      setIsEditSheetOpen(false);
      toast({
        title: "Utilisateur mis à jour",
        description: "Les informations de l'utilisateur ont été mises à jour avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour",
        variant: "destructive",
      });
    } finally {
      setSavingUser(false);
    }
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

  const handleAvatarChange = async (userId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onUpdateAvatar) return;
    
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier image",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 2 Mo",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(userId);
    try {
      await onUpdateAvatar(userId, file);
    } catch (error) {
      console.error('Error updating avatar:', error);
    } finally {
      setUploadingAvatar(null);
    }
  };

  // Mettre à jour selectedUser quand users change (pour refléter les changements d'avatar, etc.)
  useEffect(() => {
    if (selectedUser && isEditSheetOpen) {
      const updatedUser = users.find(u => u.id === selectedUser.id);
      if (updatedUser && updatedUser.avatar_url !== selectedUser.avatar_url) {
        setSelectedUser(updatedUser);
        // Mettre à jour aussi le formulaire avec les nouvelles données
        editForm.reset({
          first_name: updatedUser.first_name || '',
          last_name: updatedUser.last_name || '',
          status: updatedUser.status === 'disabled' ? 'disabled' : 'active',
          is_member: updatedUser.is_member === true,
          roles: {
            admin: hasRole(updatedUser, 'admin'),
            moderator: hasRole(updatedUser, 'moderator'),
            program_manager: hasRole(updatedUser, 'program_manager'),
          },
        });
      }
    }
  }, [users, isEditSheetOpen, selectedUser?.id]);

  const openDeleteDialog = (user: any) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!onDeleteUser || !userToDelete) return;

    setDeletingUser(userToDelete.id);
    try {
      await onDeleteUser(userToDelete.id);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      toast({
        title: "Utilisateur supprimé",
        description: `${userToDelete.first_name} ${userToDelete.last_name} a été supprimé définitivement.`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setDeletingUser(null);
    }
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
                    <TableHead>Date d'inscription</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Rôles</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="relative group">
                          <Avatar className="h-9 w-9">
                            {user.avatar_url ? (
                              <AvatarImage src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} />
                            ) : null}
                            <AvatarFallback>{getInitials(user.first_name, user.last_name)}</AvatarFallback>
                          </Avatar>
                          {onUpdateAvatar && (
                            <label 
                              htmlFor={`avatar-${user.id}`}
                              className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                            >
                              {uploadingAvatar === user.id ? (
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                              ) : (
                                <Camera className="h-4 w-4 text-white" />
                              )}
                              <input
                                id={`avatar-${user.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleAvatarChange(user.id, e)}
                                disabled={uploadingAvatar === user.id}
                              />
                            </label>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}` 
                          : 'Utilisateur'}
                      </TableCell>
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
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditSheet(user)}
                            className="gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            Modifier
                          </Button>
                          <Button 
                            variant={user.status === 'disabled' ? "default" : "destructive"}
                            size="sm"
                            onClick={() => handleToggleUserStatus(user.id, user.status === 'disabled')}
                          >
                            {user.status === 'disabled' ? "Activer" : "Désactiver"}
                          </Button>
                          {user.status === 'disabled' && onDeleteUser && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => openDeleteDialog(user)}
                              disabled={deletingUser === user.id}
                            >
                              {deletingUser === user.id ? (
                                <>Suppression...</>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4" />
                                  Supprimer
                                </>
                              )}
                            </Button>
                          )}
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?
            </DialogDescription>
          </DialogHeader>

          {userToDelete && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                  <Trash2 className="h-4 w-4" />
                  Utilisateur à supprimer
                </div>
                <div className="text-sm text-red-700">
                  <p><strong>Nom :</strong> {userToDelete.first_name} {userToDelete.last_name}</p>
                  <p><strong>Email :</strong> {userToDelete.email}</p>
                  <p><strong>Statut :</strong> {userToDelete.status === 'disabled' ? 'Désactivé' : 'Actif'}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deletingUser !== null}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={deletingUser !== null}
            >
              {deletingUser ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Modifier l'utilisateur</SheetTitle>
            <SheetDescription>
              Modifiez toutes les informations de l'utilisateur. Les modifications seront sauvegardées lorsque vous cliquerez sur "Enregistrer".
            </SheetDescription>
          </SheetHeader>

          {selectedUser && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdateUser)} className="space-y-6 mt-6">
                {/* Avatar */}
                <div className="space-y-2">
                  <Label>Avatar</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      {selectedUser.avatar_url ? (
                        <AvatarImage src={selectedUser.avatar_url} alt={`${selectedUser.first_name} ${selectedUser.last_name}`} />
                      ) : null}
                      <AvatarFallback>{getInitials(selectedUser.first_name, selectedUser.last_name)}</AvatarFallback>
                    </Avatar>
                    {onUpdateAvatar && (
                      <div>
                        <input
                          id="avatar-edit"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleAvatarChange(selectedUser.id, e)}
                          disabled={uploadingAvatar === selectedUser.id}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => document.getElementById('avatar-edit')?.click()}
                          disabled={uploadingAvatar === selectedUser.id}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          {uploadingAvatar === selectedUser.id ? 'Téléchargement...' : 'Changer l\'avatar'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prénom */}
                <FormField
                  control={editForm.control}
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

                {/* Nom */}
                <FormField
                  control={editForm.control}
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

                {/* Statut */}
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Statut</FormLabel>
                        <FormDescription>
                          Activer ou désactiver le compte utilisateur
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value === 'active'}
                          onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'disabled')}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Adhésion */}
                <FormField
                  control={editForm.control}
                  name="is_member"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Adhésion</FormLabel>
                        <FormDescription>
                          Définir si l'utilisateur est un adhérent
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Rôles */}
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Rôles</Label>
                    <p className="text-sm text-muted-foreground">
                      Attribuer des rôles spécifiques à l'utilisateur
                    </p>
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="roles.admin"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-5 w-5 text-red-500" />
                          <FormLabel>Administrateur</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="roles.moderator"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <UserCheck className="h-5 w-5 text-blue-500" />
                          <FormLabel>Modérateur</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="roles.program_manager"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <PenTool className="h-5 w-5 text-green-500" />
                          <FormLabel>Équipe Programme</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <SheetFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditSheetOpen(false)}
                    disabled={savingUser}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={savingUser}>
                    {savingUser ? (
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
                </SheetFooter>
              </form>
            </Form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default UserManagement;


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
import { Search, UserCheck, Shield, UserX, UserPlus } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from '@/components/ui/use-toast';

interface UserManagementProps {
  users: any[];
  loading: boolean;
  onRoleChange: (userId: string, role: 'moderator' | 'admin', action: 'add' | 'remove') => Promise<void>;
  onInviteUser: (userData: InviteUserFormValues) => Promise<void>;
  onToggleUserStatus: (userId: string, isActive: boolean) => Promise<void>;
}

// Schéma de validation pour le formulaire d'invitation
const inviteUserSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Veuillez entrer une adresse email valide"),
});

type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

const UserManagement: React.FC<UserManagementProps> = ({ 
  users, 
  loading, 
  onRoleChange,
  onInviteUser,
  onToggleUserStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // Formulaire d'invitation
  const form = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
    },
  });

  // Gérer l'invitation d'un utilisateur
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

  // Gérer la désactivation/réactivation d'un utilisateur
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

  // Filtrer les utilisateurs en fonction du terme de recherche
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower)
    );
  });

  // Ouvrir le dialogue pour modifier les rôles d'un utilisateur
  const openRoleDialog = (user: any) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  // Vérifier si un utilisateur a un rôle spécifique
  const hasRole = (user: any, role: string) => {
    return user.roles?.includes(role) || false;
  };

  // Gérer le changement de rôle
  const handleRoleToggle = async (role: 'moderator' | 'admin') => {
    if (!selectedUser) return;
    
    const hasRoleNow = hasRole(selectedUser, role);
    await onRoleChange(
      selectedUser.id, 
      role, 
      hasRoleNow ? 'remove' : 'add'
    );
    
    // Mettre à jour l'utilisateur sélectionné localement
    const updatedRoles = hasRoleNow 
      ? selectedUser.roles.filter((r: string) => r !== role)
      : [...(selectedUser.roles || []), role];
    
    setSelectedUser({
      ...selectedUser,
      roles: updatedRoles
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un utilisateur..."
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
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-10">
          <p>Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Email</TableHead>
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
                  {user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : 'Utilisateur'}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  {user.status === 'invited' && (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Invité</Badge>
                  )}
                  {user.status === 'disabled' && (
                    <Badge variant="outline" className="bg-red-100 text-red-800">Désactivé</Badge>
                  )}
                  {(!user.status || user.status === 'active') && (
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
                      onClick={() => openRoleDialog(user)}
                    >
                      Gérer les rôles
                    </Button>
                    {user.status !== 'invited' && (
                      <Button 
                        variant={user.status === 'disabled' ? "default" : "destructive"}
                        size="sm"
                        onClick={() => handleToggleUserStatus(user.id, user.status === 'disabled')}
                      >
                        {user.status === 'disabled' ? "Activer" : "Désactiver"}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialogue de gestion des rôles */}
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
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue d'invitation */}
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

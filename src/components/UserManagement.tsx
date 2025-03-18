
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, UserCheck, Shield, UserX } from 'lucide-react';

interface UserManagementProps {
  users: any[];
  loading: boolean;
  onRoleChange: (userId: string, role: 'moderator' | 'admin', action: 'add' | 'remove') => Promise<void>;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, loading, onRoleChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un utilisateur..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openRoleDialog(user)}
                  >
                    Gérer les rôles
                  </Button>
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
    </div>
  );
};

export default UserManagement;

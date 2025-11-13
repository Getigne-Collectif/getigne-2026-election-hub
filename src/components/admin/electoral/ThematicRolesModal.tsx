import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';
import type {
  ElectoralListMemberWithDetails,
  ThematicRole,
} from '@/types/electoral.types';

interface ThematicRolesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: ElectoralListMemberWithDetails | null;
  availableRoles: ThematicRole[];
  onSave: (roleIds: string[], primaryRoleId: string | null) => void;
}

const ThematicRolesModal = ({
  open,
  onOpenChange,
  member,
  availableRoles,
  onSave,
}: ThematicRolesModalProps) => {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [primaryRoleId, setPrimaryRoleId] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      const roleIds = member.roles.map((r) => r.thematic_role.id);
      setSelectedRoleIds(roleIds);

      const primaryRole = member.roles.find((r) => r.is_primary);
      setPrimaryRoleId(primaryRole ? primaryRole.thematic_role.id : null);
    } else {
      setSelectedRoleIds([]);
      setPrimaryRoleId(null);
    }
  }, [member]);

  const handleToggleRole = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoleIds([...selectedRoleIds, roleId]);
      // Si c'est le premier rôle, le définir comme principal
      if (selectedRoleIds.length === 0) {
        setPrimaryRoleId(roleId);
      }
    } else {
      setSelectedRoleIds(selectedRoleIds.filter((id) => id !== roleId));
      // Si c'était le rôle principal, réinitialiser
      if (primaryRoleId === roleId) {
        const remaining = selectedRoleIds.filter((id) => id !== roleId);
        setPrimaryRoleId(remaining.length > 0 ? remaining[0] : null);
      }
    }
  };

  const handleSave = () => {
    onSave(selectedRoleIds, primaryRoleId);
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rôles thématiques</DialogTitle>
          <DialogDescription>
            Définissez les rôles thématiques pour{' '}
            <span className="font-semibold">{member.team_member.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Sélection des rôles */}
          <div>
            <h3 className="text-sm font-medium mb-3">
              Rôles assignés
              {selectedRoleIds.length > 0 && (
                <span className="text-muted-foreground ml-2">
                  ({selectedRoleIds.length})
                </span>
              )}
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {availableRoles.map((role) => {
                const isSelected = selectedRoleIds.includes(role.id);
                return (
                  <div
                    key={role.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50"
                  >
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleToggleRole(role.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`role-${role.id}`}
                        className="font-medium cursor-pointer flex items-center gap-2"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: role.color || '#ccc' }}
                        />
                        {role.name}
                      </Label>
                      {role.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sélection du rôle principal */}
          {selectedRoleIds.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Rôle principal</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Le rôle principal sera mis en avant sur la page publique
              </p>
              <RadioGroup
                value={primaryRoleId || ''}
                onValueChange={setPrimaryRoleId}
              >
                <div className="space-y-2">
                  {selectedRoleIds.map((roleId) => {
                    const role = availableRoles.find((r) => r.id === roleId);
                    if (!role) return null;
                    return (
                      <div
                        key={role.id}
                        className="flex items-center space-x-2 p-2 rounded-lg border"
                      >
                        <RadioGroupItem value={role.id} id={`primary-${role.id}`} />
                        <Label
                          htmlFor={`primary-${role.id}`}
                          className="cursor-pointer flex items-center gap-2 flex-1"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: role.color || '#ccc' }}
                          />
                          {role.name}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ThematicRolesModal;



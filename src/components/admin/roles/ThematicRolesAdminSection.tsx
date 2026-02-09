import { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { IconSelect } from '@/components/ui/icon-select';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ThematicRolesCircleView from '@/components/admin/roles/ThematicRolesCircleView';
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  GripVertical,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TeamMember, ThematicRole, ThematicRoleInsert } from '@/types/electoral.types';

type ThematicRoleExtended = ThematicRole & {
  acronym?: string | null;
  is_commission?: boolean;
  parent_role_id?: string | null;
};

type ThematicRoleInsertExtended = ThematicRoleInsert & {
  acronym?: string | null;
  is_commission?: boolean;
  parent_role_id?: string | null;
};

type RoleMemberAssignment = {
  id: string;
  is_primary: boolean;
  electoral_list_member: {
    id: string;
    team_member: TeamMember;
  } | null;
};

type ThematicRoleWithMembers = ThematicRoleExtended & {
  electoral_member_roles?: RoleMemberAssignment[];
};

type ElectoralListMemberWithTeam = {
  id: string;
  position: number;
  team_member: TeamMember;
};

const SortableRoleCard = ({
  roleId,
  children,
}: {
  roleId: string;
  children: (options: {
    attributes: Record<string, any>;
    listeners: Record<string, any>;
    isDragging: boolean;
  }) => React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: roleId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-80' : undefined}
    >
      {children({ attributes, listeners, isDragging })}
    </div>
  );
};

type ThematicRolesAdminSectionProps = {
  showHeader?: boolean;
};

const ThematicRolesAdminSection = ({ showHeader = true }: ThematicRolesAdminSectionProps) => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<ThematicRoleWithMembers[]>([]);
  const [availableMembers, setAvailableMembers] = useState<ElectoralListMemberWithTeam[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<ThematicRoleExtended | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<ThematicRoleExtended> | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'circles'>('list');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [primaryMemberIds, setPrimaryMemberIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRoles();
    fetchAvailableMembers();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('thematic_roles')
        .select(`
          *,
          electoral_member_roles(
            id,
            is_primary,
            electoral_list_member:electoral_list_members(
              id,
              team_member:team_members(*)
            )
          )
        `)
        .order('sort_order');

      if (error) throw error;
      setRoles((data || []) as ThematicRoleWithMembers[]);
    } catch (error) {
      console.error('Erreur lors de la récupération des rôles:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les rôles thématiques.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMembers = async () => {
    setLoadingMembers(true);
    try {
      const { data: listData, error: listError } = await supabase
        .from('electoral_list')
        .select('*')
        .eq('is_active', true)
        .single();

      if (listError && listError.code !== 'PGRST116') throw listError;

      if (!listData) {
        setActiveListId(null);
        setAvailableMembers([]);
        return;
      }

      setActiveListId(listData.id);

      const { data: membersData, error: membersError } = await supabase
        .from('electoral_list_members')
        .select(
          `
          id,
          position,
          team_member:team_members(*)
        `
        )
        .eq('electoral_list_id', listData.id)
        .order('position');

      if (membersError) throw membersError;

      setAvailableMembers((membersData || []) as ElectoralListMemberWithTeam[]);
    } catch (error) {
      console.error('Erreur lors de la récupération des membres:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les membres associés.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  };

  const toggleMemberSelection = (memberId: string, checked: boolean) => {
    setSelectedMemberIds((prev) => {
      const updated = new Set(prev);
      if (checked) {
        updated.add(memberId);
      } else {
        updated.delete(memberId);
      }
      return updated;
    });

    if (!checked) {
      setPrimaryMemberIds((prev) => {
        const updated = new Set(prev);
        updated.delete(memberId);
        return updated;
      });
    }
  };

  const togglePrimaryForMember = (memberId: string, checked: boolean) => {
    setSelectedMemberIds((prev) => {
      const updated = new Set(prev);
      if (checked) {
        updated.add(memberId);
      }
      return updated;
    });

    setPrimaryMemberIds((prev) => {
      const updated = new Set(prev);
      if (checked) {
        updated.add(memberId);
      } else {
        updated.delete(memberId);
      }
      return updated;
    });
  };

  const syncRoleMembers = async (roleId: string) => {
    const memberIds = Array.from(selectedMemberIds);

    const { error: deleteError } = await supabase
      .from('electoral_member_roles')
      .delete()
      .eq('thematic_role_id', roleId);

    if (deleteError) throw deleteError;

    if (memberIds.length === 0) return;

    const primaryIds = Array.from(primaryMemberIds);
    if (primaryIds.length > 0) {
      const { error: clearPrimaryError } = await supabase
        .from('electoral_member_roles')
        .update({ is_primary: false })
        .in('electoral_list_member_id', primaryIds);

      if (clearPrimaryError) throw clearPrimaryError;
    }

    const rolesToInsert = memberIds.map((memberId) => ({
      electoral_list_member_id: memberId,
      thematic_role_id: roleId,
      is_primary: primaryMemberIds.has(memberId),
    }));

    const { error: insertError } = await supabase
      .from('electoral_member_roles')
      .insert(rolesToInsert);

    if (insertError) throw insertError;
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;

    try {
      const { error: deleteRolesError } = await supabase
        .from('electoral_member_roles')
        .delete()
        .eq('thematic_role_id', roleToDelete.id);

      if (deleteRolesError) throw deleteRolesError;

      const { error } = await supabase
        .from('thematic_roles')
        .delete()
        .eq('id', roleToDelete.id);

      if (error) throw error;

      toast({
        title: 'Rôle supprimé',
        description: 'Le rôle thématique a été supprimé avec succès.',
      });

      fetchRoles();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le rôle.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleSave = async () => {
    if (!editingRole) return;

    if (!editingRole.name?.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom est requis.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      let roleId = editingRole.id;
      if (editingRole.id) {
        const { error } = await supabase
          .from('thematic_roles')
          .update({
            name: editingRole.name,
            acronym: editingRole.acronym || null,
            description: editingRole.description || null,
            color: editingRole.color || null,
            icon: editingRole.icon || null,
            is_commission: !!editingRole.is_commission,
            parent_role_id: editingRole.is_commission
              ? editingRole.parent_role_id || null
              : null,
          })
          .eq('id', editingRole.id);

        if (error) throw error;

        toast({
          title: 'Rôle mis à jour',
          description: 'Le rôle thématique a été mis à jour avec succès.',
        });
      } else {
        const maxSortOrder = roles.length > 0 
          ? Math.max(...roles.map(r => r.sort_order)) 
          : 0;

        const insertData: ThematicRoleInsertExtended = {
          name: editingRole.name,
          acronym: editingRole.acronym || null,
          description: editingRole.description || null,
          color: editingRole.color || null,
          icon: editingRole.icon || null,
          is_commission: !!editingRole.is_commission,
          parent_role_id: editingRole.is_commission
            ? editingRole.parent_role_id || null
            : null,
          sort_order: maxSortOrder + 1,
        };

        const { data: createdRole, error } = await supabase
          .from('thematic_roles')
          .insert(insertData as ThematicRoleInsert)
          .select('*')
          .single();

        if (error) throw error;
        roleId = createdRole?.id;

        toast({
          title: 'Rôle créé',
          description: 'Le rôle thématique a été créé avec succès.',
        });
      }

      if (roleId) {
        await syncRoleMembers(roleId);
      }

      fetchRoles();
      setEditDialogOpen(false);
      setEditingRole(null);
      setSelectedMemberIds(new Set());
      setPrimaryMemberIds(new Set());
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le rôle.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openCreateDialog = () => {
    setEditingRole({
      name: '',
      acronym: '',
      description: '',
      color: '#3B82F6',
      icon: '',
      is_commission: false,
      parent_role_id: null,
    });
    setSelectedMemberIds(new Set());
    setPrimaryMemberIds(new Set());
    setEditDialogOpen(true);
  };

  const openEditDialog = (role: ThematicRoleWithMembers) => {
    setEditingRole(role);
    const roleMembers = role.electoral_member_roles || [];
    const memberIds = new Set(
      roleMembers
        .filter((assignment) => assignment.electoral_list_member)
        .map((assignment) => assignment.electoral_list_member!.id)
    );
    const primaryIds = new Set(
      roleMembers
        .filter((assignment) => assignment.is_primary && assignment.electoral_list_member)
        .map((assignment) => assignment.electoral_list_member!.id)
    );
    setSelectedMemberIds(memberIds);
    setPrimaryMemberIds(primaryIds);
    setEditDialogOpen(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = roles.findIndex((role) => role.id === active.id);
    const newIndex = roles.findIndex((role) => role.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(roles, oldIndex, newIndex).map((role, index) => ({
      ...role,
      sort_order: index + 1,
    }));

    setRoles(reordered);

    try {
      const updates = reordered.map((role) =>
        supabase
          .from('thematic_roles')
          .update({ sort_order: role.sort_order })
          .eq('id', role.id)
      );
      const results = await Promise.all(updates);
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
    } catch (error) {
      console.error('Erreur lors du tri des rôles:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de réordonner les rôles.',
        variant: 'destructive',
      });
      fetchRoles();
    }
  };

  return (
    <div className="py-4">
      {showHeader && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Rôles thématiques</h1>
          <p className="text-muted-foreground">
            Gérez les rôles thématiques pour la liste électorale
          </p>
        </div>
      )}

      <div
        className={`flex flex-col gap-4 sm:flex-row sm:items-center mb-6 ${
          showHeader ? 'sm:justify-between' : 'sm:justify-end'
        }`}
      >
        {showHeader && <div />}
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value) setViewMode(value as 'list' | 'circles');
            }}
            variant="outline"
            size="sm"
            className="gap-0"
          >
            <ToggleGroupItem
              value="list"
              className="rounded-l-md rounded-r-none border-r-0"
            >
              Liste
            </ToggleGroupItem>
            <ToggleGroupItem
              value="circles"
              className="rounded-l-none rounded-r-md -ml-px"
            >
              Organigramme
            </ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau rôle
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-getigne-accent" />
        </div>
      ) : viewMode === 'circles' ? (
        <div className="rounded-lg border bg-white p-4">
          <ThematicRolesCircleView
            roles={roles}
            onSelectRole={(roleId) => {
              const selected = roles.find((role) => role.id === roleId);
              if (selected) openEditDialog(selected);
            }}
          />
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={roles.map((role) => role.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid gap-4">
              {roles.map((role) => (
                <SortableRoleCard key={role.id} roleId={role.id}>
                  {({ attributes, listeners }) => (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <GripVertical
                            className="h-5 w-5 text-gray-400 cursor-grab active:cursor-grabbing"
                            {...attributes}
                            {...listeners}
                          />

                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: role.color || '#ccc' }}
                          />

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-lg">{role.name}</h3>
                              {role.acronym && (
                                <span className="text-xs text-muted-foreground">
                                  ({role.acronym})
                                </span>
                              )}
                              {role.is_commission && (
                                <Badge variant="secondary">Commission</Badge>
                              )}
                            </div>
                            {role.description && (
                              <p className="text-sm text-muted-foreground">
                                {role.description}
                              </p>
                            )}
                            {role.parent_role_id && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Rôle parent :{' '}
                                {roles.find((parent) => parent.id === role.parent_role_id)?.name ||
                                  'Non défini'}
                              </p>
                            )}
                            <div className="mt-2">
                              <TooltipProvider>
                                <div className="flex flex-wrap gap-2">
                                  {(role.electoral_member_roles || [])
                                    .slice()
                                    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
                                    .filter((assignment) => assignment.electoral_list_member?.team_member)
                                    .map((assignment) => {
                                      const member = assignment.electoral_list_member!.team_member;
                                      const isPrimary = assignment.is_primary;
                                      return (
                                        <Tooltip key={member.id}>
                                          <TooltipTrigger asChild>
                                            <Avatar
                                              className="h-7 w-7 shadow-sm"
                                              style={{
                                                borderWidth: isPrimary ? 3 : 1,
                                                borderColor: isPrimary
                                                  ? role.color || '#9CA3AF'
                                                  : '#FFFFFF',
                                              }}
                                            >
                                              <AvatarImage
                                                src={member.image || undefined}
                                                alt={member.name}
                                              />
                                              <AvatarFallback className="text-[10px]">
                                                {getInitials(member.name)}
                                              </AvatarFallback>
                                            </Avatar>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{member.name}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      );
                                    })}
                                </div>
                              </TooltipProvider>
                              {(role.electoral_member_roles || []).length === 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Aucun membre associé
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(role)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setRoleToDelete(role);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </SortableRoleCard>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {!loading && roles.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Aucun rôle thématique. Commencez par en ajouter un.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRole?.id ? 'Modifier le rôle' : 'Nouveau rôle'}
            </DialogTitle>
            <DialogDescription>
              {editingRole?.id
                ? 'Modifiez les informations du rôle thématique'
                : 'Ajoutez un nouveau rôle thématique pour la liste'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="acronym">Acronyme (optionnel)</Label>
              <Input
                id="acronym"
                value={editingRole?.acronym || ''}
                onChange={(e) =>
                  setEditingRole({ ...editingRole, acronym: e.target.value })
                }
                placeholder="ex: URB"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_commission"
                  checked={!!editingRole?.is_commission}
                  onCheckedChange={(checked) =>
                    setEditingRole({
                      ...editingRole,
                      is_commission: checked as boolean,
                      parent_role_id: checked ? editingRole?.parent_role_id || null : null,
                    })
                  }
                />
                <Label htmlFor="is_commission">Commission</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Active l’affichage “Commission” et permet de choisir un rôle parent.
              </p>
            </div>

            {editingRole?.is_commission && (
              <div>
                <Label htmlFor="parent-role">Rôle parent</Label>
                <Select
                  value={editingRole?.parent_role_id || 'none'}
                  onValueChange={(value) =>
                    setEditingRole({
                      ...editingRole,
                      parent_role_id: value === 'none' ? null : value,
                    })
                  }
                >
                  <SelectTrigger id="parent-role">
                    <SelectValue placeholder="Sélectionner un rôle parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun parent</SelectItem>
                    {roles
                      .filter((role) => role.id !== editingRole?.id)
                      .map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="name">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={editingRole?.name || ''}
                onChange={(e) =>
                  setEditingRole({ ...editingRole, name: e.target.value })
                }
                placeholder="ex: Urbanisme, Enfance..."
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editingRole?.description || ''}
                onChange={(e) =>
                  setEditingRole({ ...editingRole, description: e.target.value })
                }
                placeholder="Courte description du domaine..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="color">Couleur</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={editingRole?.color || '#3B82F6'}
                  onChange={(e) =>
                    setEditingRole({ ...editingRole, color: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={editingRole?.color || '#3B82F6'}
                  onChange={(e) =>
                    setEditingRole({ ...editingRole, color: e.target.value })
                  }
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="icon">Icône (lucide-react)</Label>
              <div className="mt-2">
                <IconSelect
                  value={editingRole?.icon || ''}
                  onChange={(value) => setEditingRole({ ...editingRole, icon: value })}
                />
              </div>
            </div>

            <div>
              <Label>Membres associés</Label>
              {activeListId ? (
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                  {loadingMembers && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement des membres...
                    </div>
                  )}
                  {!loadingMembers && availableMembers.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Aucun membre dans la liste électorale active.
                    </p>
                  )}
                  {!loadingMembers &&
                    availableMembers.map((member) => {
                      const isSelected = selectedMemberIds.has(member.id);
                      const isPrimary = primaryMemberIds.has(member.id);
                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 rounded-lg border p-2 hover:bg-gray-50"
                        >
                          <Checkbox
                            id={`member-${member.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              toggleMemberSelection(member.id, checked as boolean)
                            }
                          />
                          <Avatar className="h-7 w-7">
                            <AvatarImage
                              src={member.team_member.image || undefined}
                              alt={member.team_member.name}
                            />
                            <AvatarFallback className="text-[10px]">
                              {getInitials(member.team_member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <Label
                            htmlFor={`member-${member.id}`}
                            className="cursor-pointer flex-1"
                          >
                            {member.team_member.name}
                          </Label>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`primary-${member.id}`}
                              checked={isPrimary}
                              onCheckedChange={(checked) =>
                                togglePrimaryForMember(member.id, checked as boolean)
                              }
                              disabled={!isSelected}
                            />
                            <Label
                              htmlFor={`primary-${member.id}`}
                              className={`text-xs ${!isSelected ? 'text-muted-foreground' : ''}`}
                            >
                              Commission principale
                            </Label>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  Aucune liste électorale active pour associer des membres.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingRole(null);
              }}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
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
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le rôle "{roleToDelete?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ThematicRolesAdminSection;

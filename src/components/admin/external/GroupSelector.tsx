import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Search, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExternalGroup } from '@/types/external-directory.types';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface GroupWithRole {
  groupId: string;
  groupName: string;
  role?: string;
}

interface GroupSelectorProps {
  value: GroupWithRole[];
  onChange: (groups: GroupWithRole[]) => void;
  className?: string;
}

const GroupSelector = ({ value, onChange, className }: GroupSelectorProps) => {
  const [groups, setGroups] = useState<ExternalGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('external_groups')
        .select('*')
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des groupes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addGroup = (group: ExternalGroup) => {
    if (!value.find(g => g.groupId === group.id)) {
      onChange([...value, { groupId: group.id, groupName: group.name, role: '' }]);
    }
    setOpen(false);
  };

  const removeGroup = (groupId: string) => {
    onChange(value.filter(g => g.groupId !== groupId));
  };

  const updateRole = (groupId: string, role: string) => {
    onChange(value.map(g => 
      g.groupId === groupId ? { ...g, role } : g
    ));
  };

  // Filtrer les groupes déjà sélectionnés
  const availableGroups = groups.filter(g => 
    !value.find(selected => selected.groupId === g.id)
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Groupes sélectionnés */}
      {value.length > 0 && (
        <div className="space-y-3">
          {value.map((groupWithRole) => (
            <div key={groupWithRole.groupId} className="flex gap-2 items-start p-3 border rounded-lg">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-green-600" />
                </div>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{groupWithRole.groupName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeGroup(groupWithRole.groupId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor={`role-${groupWithRole.groupId}`} className="text-xs text-muted-foreground">
                    Rôle dans le groupe (optionnel)
                  </Label>
                  <Input
                    id={`role-${groupWithRole.groupId}`}
                    type="text"
                    value={groupWithRole.role || ''}
                    onChange={(e) => updateRole(groupWithRole.groupId, e.target.value)}
                    placeholder="ex: Président, Membre, Trésorier..."
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sélecteur de groupe */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-left font-normal"
            disabled={loading || availableGroups.length === 0}
          >
            <Search className="mr-2 h-4 w-4" />
            {loading ? 'Chargement...' : availableGroups.length === 0 ? 'Tous les groupes sont sélectionnés' : 'Ajouter un groupe'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher un groupe..." />
            <CommandList>
              <CommandEmpty>Aucun groupe trouvé</CommandEmpty>
              <CommandGroup>
                {availableGroups.map((group) => (
                  <CommandItem
                    key={group.id}
                    value={group.name}
                    onSelect={() => addGroup(group)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{group.name}</div>
                        {group.city && (
                          <div className="text-xs text-muted-foreground">{group.city}</div>
                        )}
                      </div>
                      {group.tags && group.tags.length > 0 && (
                        <div className="flex gap-1">
                          {group.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Aucun groupe sélectionné
        </p>
      )}
    </div>
  );
};

export default GroupSelector;

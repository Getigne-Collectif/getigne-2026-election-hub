import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Download, 
  Loader2, 
  Mail, 
  Phone, 
  MapPin,
  User,
  Building2,
  Users,
  Filter,
  X,
  Edit,
  Trash2,
  Plus,
  UserPlus
} from 'lucide-react';
import type { DirectoryEntry, ExternalContactWithGroups, ExternalGroupWithContacts } from '@/types/external-directory.types';
import { downloadExternalContactVCard, downloadMultipleExternalVCards } from '@/utils/vcard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Routes, generateRoutes } from '@/routes';
import ExternalContactDetailDialog from './ExternalContactDetailDialog';

type FilterType = 'all' | 'contacts' | 'groups';

// Helpers pour gérer les cookies
const setCookie = (name: string, value: string, days: number = 30) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
};

const ExternalContactsList = () => {
  const [contacts, setContacts] = useState<ExternalContactWithGroups[]>([]);
  const [groups, setGroups] = useState<ExternalGroupWithContacts[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Initialiser les états depuis les cookies
  const [searchQuery, setSearchQuery] = useState(() => getCookie('externalDirectory_search') || '');
  const [filterType, setFilterType] = useState<FilterType>(() => {
    const saved = getCookie('externalDirectory_filterType');
    return (saved === 'contacts' || saved === 'groups') ? saved : 'all';
  });
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const saved = getCookie('externalDirectory_tags');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedGroup, setSelectedGroup] = useState<string>(() => getCookie('externalDirectory_group') || 'all');
  const [activeLetter, setActiveLetter] = useState('A');
  
  // État pour la suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'contact' | 'group'; id: string; name: string } | null>(null);
  
  // État pour la dialog de détails
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ExternalContactWithGroups | null>(null);
  
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Sauvegarder les filtres dans les cookies à chaque changement
  useEffect(() => {
    setCookie('externalDirectory_search', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setCookie('externalDirectory_filterType', filterType);
  }, [filterType]);

  useEffect(() => {
    setCookie('externalDirectory_tags', JSON.stringify(selectedTags));
  }, [selectedTags]);

  useEffect(() => {
    setCookie('externalDirectory_group', selectedGroup);
  }, [selectedGroup]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupérer les contacts avec leurs groupes
      const { data: contactsData, error: contactsError } = await supabase
        .from('external_contacts')
        .select('*')
        .order('first_name');

      if (contactsError) throw contactsError;

      const contactsWithGroups: ExternalContactWithGroups[] = await Promise.all(
        (contactsData || []).map(async (contact) => {
          const { data: groupsData } = await supabase
            .from('external_contact_groups')
            .select(`
              id,
              role,
              group:external_groups(*)
            `)
            .eq('contact_id', contact.id);

          return {
            ...contact,
            groups: (groupsData || []).map((g: any) => ({
              id: g.id,
              role: g.role,
              group: g.group,
            })),
          };
        })
      );

      // Récupérer les groupes avec leurs membres
      const { data: groupsData, error: groupsError } = await supabase
        .from('external_groups')
        .select('*')
        .order('name');

      if (groupsError) throw groupsError;

      const groupsWithContacts: ExternalGroupWithContacts[] = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { data: contactsData } = await supabase
            .from('external_contact_groups')
            .select(`
              id,
              role,
              contact:external_contacts(*)
            `)
            .eq('group_id', group.id);

          return {
            ...group,
            contacts: (contactsData || []).map((c: any) => ({
              id: c.id,
              role: c.role,
              contact: c.contact,
            })),
          };
        })
      );

      setContacts(contactsWithGroups);
      setGroups(groupsWithContacts);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les contacts et groupes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Récupérer tous les tags uniques
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    contacts.forEach(c => c.tags?.forEach(t => tagsSet.add(t)));
    groups.forEach(g => g.tags?.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet).sort();
  }, [contacts, groups]);

  // Créer les entrées mixtes
  const entries = useMemo((): DirectoryEntry[] => {
    const contactEntries: DirectoryEntry[] = contacts.map(c => ({
      type: 'contact' as const,
      data: c,
    }));
    
    const groupEntries: DirectoryEntry[] = groups.map(g => ({
      type: 'group' as const,
      data: g,
    }));

    return [...contactEntries, ...groupEntries];
  }, [contacts, groups]);

  // Filtrer les entrées
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Filtre par type
      if (filterType === 'contacts' && entry.type !== 'contact') return false;
      if (filterType === 'groups' && entry.type !== 'group') return false;

      const query = searchQuery.toLowerCase();
      
      // Recherche textuelle
      if (query) {
        if (entry.type === 'contact') {
          const c = entry.data;
          const fullName = c.last_name ? `${c.first_name} ${c.last_name}` : c.first_name;
          const matchesSearch = 
            fullName.toLowerCase().includes(query) ||
            (c.email && c.email.toLowerCase().includes(query)) ||
            (c.phone && c.phone.toLowerCase().includes(query)) ||
            (c.city && c.city.toLowerCase().includes(query));
          if (!matchesSearch) return false;
        } else {
          const g = entry.data;
          const matchesSearch =
            g.name.toLowerCase().includes(query) ||
            (g.city && g.city.toLowerCase().includes(query)) ||
            (g.description && g.description.toLowerCase().includes(query));
          if (!matchesSearch) return false;
        }
      }

      // Filtre par tags
      if (selectedTags.length > 0) {
        const entryTags = entry.data.tags || [];
        const hasTag = selectedTags.some(tag => entryTags.includes(tag));
        if (!hasTag) return false;
      }

      // Filtre par groupe
      if (selectedGroup !== 'all') {
        if (entry.type === 'contact') {
          // Pour les contacts, vérifier qu'ils appartiennent au groupe sélectionné
          const hasGroup = entry.data.groups.some(g => g.group.id === selectedGroup);
          if (!hasGroup) return false;
        } else {
          // Pour les groupes, afficher uniquement le groupe sélectionné
          if (entry.data.id !== selectedGroup) return false;
        }
      }

      return true;
    });
  }, [entries, searchQuery, filterType, selectedTags, selectedGroup]);

  // Grouper les entrées par lettre initiale
  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: DirectoryEntry[] } = {};
    
    filteredEntries.forEach((entry) => {
      let firstLetter: string;
      if (entry.type === 'contact') {
        firstLetter = entry.data.first_name.charAt(0).toUpperCase();
      } else {
        firstLetter = entry.data.name.charAt(0).toUpperCase();
      }
      
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(entry);
    });
    
    return groups;
  }, [filteredEntries]);

  // Générer l'alphabet complet
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Scroll vers une lettre
  const scrollToLetter = (letter: string) => {
    const section = sectionRefs.current[letter];
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Détecter la lettre active au scroll
  useEffect(() => {
    if (!containerRef.current) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset pour le header

      // Trouver quelle section est visible
      for (const letter of Object.keys(groupedEntries).sort()) {
        const section = sectionRefs.current[letter];
        if (section) {
          const { offsetTop, offsetHeight } = section;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveLetter(letter);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [groupedEntries]);

  // Statistiques
  const stats = useMemo(() => {
    const contactCount = filteredEntries.filter(e => e.type === 'contact').length;
    const groupCount = filteredEntries.filter(e => e.type === 'group').length;
    return { contactCount, groupCount };
  }, [filteredEntries]);

  const handleExportAll = () => {
    const contactsToExport = filteredEntries
      .filter(e => e.type === 'contact')
      .map(e => e.data as ExternalContactWithGroups);

    if (contactsToExport.length === 0) {
      toast({
        title: 'Aucun contact',
        description: 'Il n\'y a aucun contact à exporter.',
        variant: 'destructive',
      });
      return;
    }

    downloadMultipleExternalVCards(contactsToExport);
    toast({
      title: 'Export réussi',
      description: `${contactsToExport.length} contact(s) exporté(s) au format vCard`,
    });
  };

  const handleDownloadSingle = (contact: ExternalContactWithGroups) => {
    downloadExternalContactVCard(contact);
    const fullName = contact.last_name 
      ? `${contact.first_name} ${contact.last_name}`
      : contact.first_name;
    toast({
      title: 'vCard téléchargée',
      description: `Contact de ${fullName} exporté avec succès`,
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const getFullName = (contact: ExternalContactWithGroups) => {
    return contact.last_name 
      ? `${contact.first_name} ${contact.last_name}`
      : contact.first_name;
  };

  const handleGroupClick = (groupId: string) => {
    setSelectedGroup(groupId);
    // Si on était en mode "Groupes uniquement", passer à "Tous" pour voir le groupe ET ses contacts
    if (filterType === 'groups') {
      setFilterType('all');
    }
    // Scroll vers le haut pour voir les résultats
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactClick = (contact: ExternalContactWithGroups) => {
    setSelectedContact(contact);
    setDetailDialogOpen(true);
  };

  const handleEditContact = (contactId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(generateRoutes.adminExternalContactsEdit(contactId));
  };

  const handleEditGroup = (groupId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(generateRoutes.adminExternalGroupsEdit(groupId));
  };

  const handleDeleteClick = (type: 'contact' | 'group', id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItemToDelete({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'contact') {
        // Supprimer d'abord les liaisons
        const { error: linkError } = await supabase
          .from('external_contact_groups')
          .delete()
          .eq('contact_id', itemToDelete.id);

        if (linkError) throw linkError;

        // Puis supprimer le contact
        const { error } = await supabase
          .from('external_contacts')
          .delete()
          .eq('id', itemToDelete.id);

        if (error) throw error;

        setContacts(prev => prev.filter(c => c.id !== itemToDelete.id));
      } else {
        // Supprimer d'abord les liaisons
        const { error: linkError } = await supabase
          .from('external_contact_groups')
          .delete()
          .eq('group_id', itemToDelete.id);

        if (linkError) throw linkError;

        // Puis supprimer le groupe
        const { error } = await supabase
          .from('external_groups')
          .delete()
          .eq('id', itemToDelete.id);

        if (error) throw error;

        setGroups(prev => prev.filter(g => g.id !== itemToDelete.id));
      }

      toast({
        title: 'Suppression réussie',
        description: `${itemToDelete.name} a été supprimé${itemToDelete.type === 'contact' ? '' : 'e'} avec succès`,
      });
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer cet élément.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Barre de filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>

        <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
          <SelectTrigger className="w-full sm:w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="contacts">Contacts</SelectItem>
            <SelectItem value="groups">Groupes</SelectItem>
          </SelectContent>
        </Select>

        {allTags.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="mr-2 h-4 w-4" />
                Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <p className="text-sm font-medium">Filtrer par étiquettes</p>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-brand-100 transition-colors text-xs"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {groups.length > 0 && (
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-full sm:w-[180px] h-9">
              <SelectValue placeholder="Filtrer par groupe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les groupes</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button 
          onClick={handleExportAll}
          disabled={stats.contactCount === 0}
          size="sm"
          className="bg-brand hover:bg-brand/90 h-9"
        >
          <Download className="mr-2 h-3 w-3" />
          Exporter
        </Button>

        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-9">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(Routes.ADMIN_EXTERNAL_CONTACTS_NEW)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Nouveau contact
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(Routes.ADMIN_EXTERNAL_GROUPS_NEW)}>
                <Building2 className="mr-2 h-4 w-4" />
                Nouveau groupe
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Filtres actifs */}
      {(selectedTags.length > 0 || selectedGroup !== 'all') && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Filtres actifs:</span>
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
              <button
                onClick={() => toggleTag(tag)}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedGroup !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Groupe: {groups.find(g => g.id === selectedGroup)?.name}
              <button
                onClick={() => setSelectedGroup('all')}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Statistiques */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>{stats.contactCount} contact{stats.contactCount > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span>{stats.groupCount} groupe{stats.groupCount > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Liste des entrées avec interface répertoire */}
      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery || selectedTags.length > 0 || selectedGroup !== 'all'
                ? 'Aucun résultat ne correspond à votre recherche.'
                : 'Aucun contact ou groupe externe enregistré.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative flex gap-6">
          {/* Index alphabétique sur le côté */}
          <div className="hidden lg:block sticky top-24 h-fit">
            <div className="flex flex-col gap-0.5">
              {alphabet.map((letter) => {
                const hasEntries = groupedEntries[letter] && groupedEntries[letter].length > 0;
                return (
                  <button
                    key={letter}
                    onClick={() => hasEntries && scrollToLetter(letter)}
                    disabled={!hasEntries}
                    className={cn(
                      "w-8 h-6 text-xs font-medium rounded transition-all",
                      hasEntries
                        ? activeLetter === letter
                          ? "bg-brand text-brand-fg"
                          : "hover:bg-brand-100 text-brand-600"
                        : "text-gray-300 cursor-not-allowed"
                    )}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Liste des contacts et groupes */}
          <div className="flex-1 space-y-8">
            {Object.keys(groupedEntries).sort().map((letter) => (
              <div 
                key={letter} 
                ref={(el) => (sectionRefs.current[letter] = el)}
                className="space-y-3"
              >
                <h3 className="text-2xl font-bold text-brand sticky top-16 bg-background/95 backdrop-blur-sm py-2 z-10 border-b">
                  {letter}
                </h3>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 items-start">
                  {groupedEntries[letter].map((entry) => {
            if (entry.type === 'contact') {
              const contact = entry.data;
              return (
                <Card 
                  key={`contact-${contact.id}`} 
                  className="overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-brand-500 hover:border-l-brand-600 bg-gradient-to-br from-white to-brand-50/30 cursor-pointer"
                  onClick={() => handleContactClick(contact)}
                >
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-brand-200 to-brand-100 border-2 border-brand-300">
                        {contact.photo_url ? (
                          <img
                            src={contact.photo_url}
                            alt={getFullName(contact)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="h-7 w-7 text-brand-700" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{getFullName(contact)}</h3>
                            {contact.city && (
                              <p className="text-xs text-muted-foreground">{contact.city}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadSingle(contact);
                              }}
                              title="Télécharger vCard"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:text-blue-600"
                                  onClick={(e) => handleEditContact(contact.id, e)}
                                  title="Modifier"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:text-red-600"
                                  onClick={(e) => handleDeleteClick('contact', contact.id, getFullName(contact), e)}
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {contact.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                +{contact.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="space-y-0.5 text-xs">
                          {contact.email && (
                            <div className="flex items-center gap-1 text-muted-foreground truncate">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <a href={`mailto:${contact.email}`} className="hover:text-brand-600 truncate">
                                {contact.email}
                              </a>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <a href={`tel:${contact.phone}`} className="hover:text-brand-600">
                                {contact.phone}
                              </a>
                            </div>
                          )}
                        </div>

                        {contact.groups && contact.groups.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {contact.groups.slice(0, 2).map((g) => (
                              <button
                                key={g.id}
                                onClick={() => handleGroupClick(g.group.id)}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors cursor-pointer border border-green-200"
                                title={`Filtrer par ${g.group.name}`}
                              >
                                <Building2 className="h-3 w-3" />
                                <span>{g.group.name}</span>
                                {g.role && <span className="text-green-600">({g.role})</span>}
                              </button>
                            ))}
                            {contact.groups.length > 2 && (
                              <Badge className="text-xs px-1.5 py-0 bg-green-100 text-green-700">
                                +{contact.groups.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            } else {
              const group = entry.data;
              return (
                <Card 
                  key={`group-${group.id}`} 
                  className="overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-emerald-500 hover:border-l-emerald-600 cursor-pointer bg-gradient-to-br from-white to-emerald-50/40"
                  onClick={() => handleGroupClick(group.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-200 to-emerald-100 border-2 border-emerald-300 shadow-sm">
                        {group.logo_url ? (
                          <img
                            src={group.logo_url}
                            alt={group.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-emerald-700" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Ligne 1 : Nom + Ville + Actions */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{group.name}</h3>
                            {group.city && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">• {group.city}</span>
                            )}
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:text-blue-600"
                                onClick={(e) => handleEditGroup(group.id, e)}
                                title="Modifier"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:text-red-600"
                                onClick={(e) => handleDeleteClick('group', group.id, group.name, e)}
                                title="Supprimer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Ligne 2 : Tags + Nombre de membres */}
                        <div className="flex items-center gap-2 mb-1">
                          {group.tags && group.tags.length > 0 && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              {group.tags[0]}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{group.contacts.length} membre{group.contacts.length > 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {/* Ligne 3 : Email + Description (si présents) */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {group.contact_email && (
                            <>
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <a 
                                href={`mailto:${group.contact_email}`} 
                                className="hover:text-brand-600 truncate"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {group.contact_email}
                              </a>
                              {group.description && <span className="flex-shrink-0">•</span>}
                            </>
                          )}
                          {group.description && (
                            <span className="truncate">{group.description}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }
          })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {itemToDelete?.type === 'contact' ? 'le contact' : 'le groupe'} <strong>{itemToDelete?.name}</strong> ?
              {itemToDelete?.type === 'group' && (
                <span className="block mt-2 text-red-600">
                  Attention : Toutes les liaisons avec les contacts seront également supprimées.
                </span>
              )}
              {itemToDelete?.type === 'contact' && (
                <span className="block mt-2">
                  Les liaisons avec les groupes seront également supprimées.
                </span>
              )}
              <span className="block mt-2 font-semibold">
                Cette action est irréversible.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de détails du contact */}
      <ExternalContactDetailDialog
        contact={selectedContact}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEdit={handleEditContact}
        onUpdate={fetchData}
      />
    </div>
  );
};

export default ExternalContactsList;

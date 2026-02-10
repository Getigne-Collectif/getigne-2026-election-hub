import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Search, Edit, Trash2, User, Mail, Phone } from 'lucide-react';
import { Routes, generateRoutes } from '@/routes';
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
import type { ExternalContactWithGroups } from '@/types/external-directory.types';

type ExternalContactsAdminSectionProps = {
  showHeader?: boolean;
};

const ExternalContactsAdminSection = ({ showHeader = true }: ExternalContactsAdminSectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ExternalContactWithGroups[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<ExternalContactWithGroups | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
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

      setContacts(contactsWithGroups);
    } catch (error) {
      console.error('Erreur lors de la récupération des contacts:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les contacts.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;

    try {
      const { error } = await supabase
        .from('external_contacts')
        .delete()
        .eq('id', contactToDelete.id);

      if (error) throw error;

      toast({
        title: 'Contact supprimé',
        description: 'Le contact a été supprimé avec succès.',
      });

      fetchContacts();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le contact.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  const getFullName = (contact: ExternalContactWithGroups) => {
    return contact.last_name 
      ? `${contact.first_name} ${contact.last_name}`
      : contact.first_name;
  };

  const filteredContacts = contacts.filter((contact) => {
    const fullName = getFullName(contact).toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return (
      fullName.includes(query) ||
      (contact.email && contact.email.toLowerCase().includes(query)) ||
      (contact.phone && contact.phone.toLowerCase().includes(query)) ||
      (contact.city && contact.city.toLowerCase().includes(query)) ||
      (contact.tags && contact.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  });

  return (
    <div className="py-4">
      {showHeader && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Contacts externes</h1>
          <p className="text-muted-foreground">
            Gérez les contacts individuels (personnes ressources, partenaires)
          </p>
        </div>
      )}

      <div
        className={`flex flex-col gap-4 sm:flex-row sm:items-center mb-6 ${
          showHeader ? 'sm:justify-between' : 'sm:justify-end'
        }`}
      >
        {showHeader && <div />}
        <Button onClick={() => navigate(Routes.ADMIN_EXTERNAL_CONTACTS_NEW)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau contact
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email, téléphone, ville ou étiquette..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex gap-3 p-3">
                  <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-brand-100 to-brand-50">
                    {contact.photo_url ? (
                      <img
                        src={contact.photo_url}
                        alt={getFullName(contact)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-6 w-6 text-brand-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div>
                      <h3 className="font-semibold text-sm truncate">{getFullName(contact)}</h3>
                      {contact.city && (
                        <p className="text-xs text-muted-foreground">{contact.city}</p>
                      )}
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
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </div>

                    {contact.groups && contact.groups.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {contact.groups.slice(0, 2).map((g) => (
                          <Badge key={g.id} variant="secondary" className="text-xs px-1.5 py-0">
                            {g.group.name}
                            {g.role && ` (${g.role})`}
                          </Badge>
                        ))}
                        {contact.groups.length > 2 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            +{contact.groups.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex gap-1 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() =>
                          navigate(generateRoutes.adminExternalContactsEdit(contact.id))
                        }
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setContactToDelete(contact);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredContacts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery
                ? 'Aucun contact trouvé pour cette recherche.'
                : 'Aucun contact externe. Commencez par en ajouter un.'}
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {contactToDelete && getFullName(contactToDelete)} ? Cette action est irréversible.
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

export default ExternalContactsAdminSection;


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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, FileEdit, Trash2, Plus, Calendar, MapPin, Users, Package } from 'lucide-react';
import { Link, useNavigate, generatePath } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Routes } from '@/routes';

// Helper function to generate slug
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
    .trim();
};

interface Event {
  id: string;
  title: string;
  description: string;
  content?: string;
  date: string;
  location: string;
  image: string;
  committee?: string;
  committee_id?: string;
  allow_registration?: boolean;
  is_members_only?: boolean;
  status?: string;
  slug?: string;
  event_type?: string;
  created_at: string;
  updated_at: string;
}

interface EventFormData {
  title: string;
  description: string;
  content?: string;
  date: string;
  location: string;
  image: string;
  committee_id?: string;
  allow_registration?: boolean;
  is_members_only?: boolean;
  slug?: string;
}

interface EventsManagementProps {
  events: Event[];
  loading: boolean;
  committees: { id: string; title: string }[];
  onCreateEvent: (formData: EventFormData, status: 'draft' | 'published' | 'archived') => Promise<any>;
  onUpdateEvent: (id: string, formData: Partial<EventFormData>, status?: string) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  isNeighborhoodEvents?: boolean;
}

const EventsManagement: React.FC<EventsManagementProps> = ({
  events,
  loading,
  committees,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  isNeighborhoodEvents = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleToggleStatus = async (event: Event, newStatus: string) => {
    try {
      await onUpdateEvent(event.id, {}, newStatus);
      toast({
        title: "Statut modifié",
        description: `L'événement a été marqué comme ${newStatus === 'published' ? 'publié' : newStatus === 'draft' ? 'brouillon' : 'archivé'}`,
      });
    } catch (error) {
      console.error("Error toggling event status:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de l'événement.",
        variant: "destructive"
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedEvent) return;

    try {
      await onDeleteEvent(selectedEvent.id);
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
      toast({
        title: "Événement supprimé",
        description: "L'événement a été supprimé avec succès",
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'événement",
        variant: "destructive"
      });
    }
  };

  const openDeleteDialog = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string | undefined) => {
    const eventStatus = status || 'published';
    
    switch (eventStatus) {
      case 'published':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Publié</Badge>;
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Brouillon</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Archivé</Badge>;
      default:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">{eventStatus}</Badge>;
    }
  };

  const filteredEvents = events.filter(event => {
    const searchLower = searchTerm.toLowerCase();
    return (
      event.title.toLowerCase().includes(searchLower) ||
      event.description.toLowerCase().includes(searchLower) ||
      (event.committee && event.committee.toLowerCase().includes(searchLower)) ||
      event.location.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un événement..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p>Chargement des événements...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-10">
          <p>Aucun événement trouvé.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Lieu</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">
                  <Link to={event.slug ? `/agenda/${event.slug}` : `/agenda/${event.id}`}>
                    {event.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-1" />
                    {format(new Date(event.date), "PPP", { locale: fr })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-1" />
                    {event.location}
                  </div>
                </TableCell>
                <TableCell>
                  {event.committee && (
                    <div className="flex items-center">
                      <Users size={16} className="mr-1" />
                      {event.committee}
                    </div>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(event.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(generatePath(Routes.ADMIN_EVENTS_EDIT, { id: event.id }))}
                    >
                      <FileEdit className="h-4 w-4" />
                    </Button>
                    {event.event_type === 'neighborhood' && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        title="Voir le kit d'organisation"
                      >
                        <Link to={`/cafes-de-quartier/kit?id=${event.id}`}>
                          <Package className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <select
                      value={event.status || 'published'}
                      onChange={(e) => handleToggleStatus(event, e.target.value)}
                      className="px-2 py-1 text-sm border rounded"
                    >
                      <option value="published">Publié</option>
                      <option value="draft">Brouillon</option>
                      <option value="archived">Archivé</option>
                    </select>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(event)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement l'événement
              et toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventsManagement;

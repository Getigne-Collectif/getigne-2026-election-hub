import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useAuth } from '@/context/AuthContext.tsx';
import { useToast } from '@/components/ui/use-toast.ts';
import { supabase } from '@/integrations/supabase/client.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx';
import { Plus, Search, Pencil, Trash2, Loader2, ExternalLink } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout.tsx';
import { Routes } from '@/routes';

interface LexiconEntry {
  id: string;
  name: string;
  acronym: string | null;
  content: any;
  external_link: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

const AdminLexiconPage = () => {
  const { user, isAdmin, authChecked, isRefreshingRoles } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [entries, setEntries] = useState<LexiconEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LexiconEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entryToDelete, setEntryToDelete] = useState<LexiconEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (isRefreshingRoles) return;

    if (user && isAdmin) {
      setIsAuthorized(true);
      loadEntries();
    } else {
      setIsAuthorized(false);
      if (user) {
        toast({
          variant: 'destructive',
          title: 'Accès restreint',
          description: "Vous n'avez pas les droits nécessaires pour accéder à cette page.",
        });
        navigate('/');
      } else {
        navigate('/auth');
      }
    }
    setIsChecking(false);
  }, [user, isAdmin, authChecked, navigate, toast, isRefreshingRoles]);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lexicon_entries')
        .select('*')
        .order('name');

      if (error) throw error;

      setEntries(data || []);
      setFilteredEntries(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des entrées:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les entrées du lexique',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEntries(entries);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = entries.filter(
      (entry) =>
        entry.name.toLowerCase().includes(term) ||
        entry.acronym?.toLowerCase().includes(term)
    );
    setFilteredEntries(filtered);
  }, [searchTerm, entries]);

  const handleDelete = async () => {
    if (!entryToDelete) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('lexicon_entries')
        .delete()
        .eq('id', entryToDelete.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'L\'entrée a été supprimée avec succès',
      });

      setEntries((prev) => prev.filter((e) => e.id !== entryToDelete.id));
      setEntryToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer l\'entrée',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isChecking || !authChecked || isRefreshingRoles) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-getigne-accent" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <HelmetProvider>
      <AdminLayout title="Lexique" description="Gérer le lexique et les acronymes">
        <Helmet>
          <title>Lexique - Administration</title>
        </Helmet>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Lexique</CardTitle>
                <CardDescription>
                  Gérer les termes et acronymes du lexique
                </CardDescription>
              </div>
              <Button onClick={() => navigate(Routes.ADMIN_LEXICON_NEW)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle entrée
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Rechercher par nom ou acronyme..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-getigne-accent" />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm
                  ? 'Aucune entrée trouvée'
                  : 'Aucune entrée dans le lexique'}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Logo</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Acronyme</TableHead>
                      <TableHead>Lien externe</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {entry.logo_url ? (
                            <img
                              src={entry.logo_url}
                              alt={entry.name}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                              N/A
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{entry.name}</TableCell>
                        <TableCell>
                          {entry.acronym || (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.external_link ? (
                            <a
                              href={entry.external_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-getigne-accent hover:underline"
                            >
                              <ExternalLink size={14} />
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(`/admin/lexicon/${entry.id}/edit`)
                              }
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setEntryToDelete(entry)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog
          open={!!entryToDelete}
          onOpenChange={() => !isDeleting && setEntryToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer l'entrée "{entryToDelete?.name}" ?
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </HelmetProvider>
  );
};

export default AdminLexiconPage;


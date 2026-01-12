import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Edit, Plus, Trash2 } from 'lucide-react';
import type { FAQ } from '@/types/faq.types';

export default function AdminFAQPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null);

  const { data: faqs, isLoading, refetch } = useQuery<FAQ[]>({
    queryKey: ['faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error("Erreur lors du chargement des FAQ");
        throw error;
      }

      return (data || []) as FAQ[];
    },
  });

  const handleDeleteClick = (id: string) => {
    setFaqToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!faqToDelete) return;

    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', faqToDelete);

      if (error) throw error;

      toast.success("FAQ supprimée avec succès");
      refetch();
    } catch (error: any) {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
      console.error("Delete error:", error);
    } finally {
      setDeleteDialogOpen(false);
      setFaqToDelete(null);
    }
  };

  return (
    <AdminLayout
      title="Gestion des FAQ"
      description="Créez et gérez les FAQ du site"
    >
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Liste des FAQ</CardTitle>
              <CardDescription>
                Gérez les questions fréquentes du site
              </CardDescription>
            </div>
            <Button asChild>
              <Link to="/admin/faq/edit">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle FAQ
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-6 text-center">Chargement des FAQ...</div>
          ) : faqs && faqs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="font-medium">{faq.name}</TableCell>
                    <TableCell className="text-muted-foreground">{faq.slug}</TableCell>
                    <TableCell>
                      {new Date(faq.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/admin/faq/edit/${faq.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(faq.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              Aucune FAQ pour le moment. Créez-en une pour commencer.
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la FAQ ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera également toutes les catégories et questions/réponses associées.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}



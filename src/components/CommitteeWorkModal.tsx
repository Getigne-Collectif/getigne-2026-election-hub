
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {Calendar, Loader2, Trash, Trash2} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface CommitteeWorkModalProps {
  committeeId?: string;
  work?: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: 'view' | 'edit' | 'create';
}

const CommitteeWorkModal = ({
  committeeId,
  work,
  open,
  onOpenChange,
  onSuccess,
  mode = 'view'
}: CommitteeWorkModalProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (work) {
      setTitle(work.title || '');
      setContent(work.content || '');
      setDate(work.date ? new Date(work.date).toISOString().split('T')[0] : '');
    } else {
      // Set default values for new work
      setTitle('');
      setContent('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [work]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !date) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsLoading(true);
    try {
      if (work?.id) {
        // Update existing work
        const { error } = await supabase
          .from('committee_works')
          .update({
            title,
            content,
            date,
            updated_at: new Date().toISOString()
          })
          .eq('id', work.id);

        if (error) throw error;
        toast.success("Contenu mis à jour avec succès");
      } else {
        // Create new work
        const { error } = await supabase
          .from('committee_works')
          .insert({
            title,
            content,
            date,
            committee_id: committeeId,
          });

        if (error) throw error;
        toast.success("Contenu créé avec succès");
      }

      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!work?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('committee_works')
        .delete()
        .eq('id', work.id);

      if (error) throw error;

      toast.success("Contenu supprimé avec succès");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Une erreur est survenue lors de la suppression");
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };


  // Edit/Create form
  if (mode === 'edit' || mode === 'create') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {mode === 'create' ? 'Ajouter un nouveau compte-rendu' : 'Modifier le compte-rendu'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Créez un nouveau compte-rendu pour cette commission'
                : 'Modifiez les informations du compte-rendu existant'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre du compte-rendu"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenu</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Contenu du compte-rendu"
                className="min-h-[200px]"
                required
              />
            </div>

            <DialogFooter className="pt-4 flex flex-col justify-between">
              {mode === 'edit' &&
                  <div className={"flex items-center gap-3"}>
                  {isDeleteDialogOpen &&
                      <>
                        Confirmer la suppression ?
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                        >
                          Oui
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                          Non
                        </Button>
                      </>
                  ||
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={(e) => {
                          alert('Delete');
                          setIsDeleteDialogOpen(true);
                        }}
                    >
                      <Trash2/>
                    </Button>
                  }</div>
              }
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Créer' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // View mode or no work
  if (!work) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{work.title}</DialogTitle>
            <DialogDescription className="flex items-center mt-2 text-getigne-500">
              <Calendar size={16} className="mr-1" />
              <time>{formatDate(work.date)}</time>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6">
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: work.content }} />
            </div>

            {(work.images as any[])?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(work.images as any[]).map((image, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.alt || `Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(work.files as any[])?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Documents</h3>
                <div className="space-y-2">
                  {(work.files as any[]).map((file, index) => (
                    <a
                      key={index}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 border border-getigne-100 rounded-lg hover:bg-getigne-50 transition-colors"
                    >
                      <div className="text-getigne-700">
                        <div className="font-medium">{file.name}</div>
                        {file.size && (
                          <div className="text-sm text-getigne-500">
                            {Math.round(file.size / 1024)} Ko
                          </div>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer ce contenu ? Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogContent>
      </Dialog>


    </>
  );
};

export default CommitteeWorkModal;

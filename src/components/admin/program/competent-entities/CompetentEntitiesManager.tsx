import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  Input,
} from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2, ImageIcon } from 'lucide-react';
import type { ProgramCompetentEntity } from '@/types/program.types';

const LOGO_BUCKET = 'program_competent_entity_logos';

interface EntityFormState {
  name: string;
  file: File | null;
}

const initialFormState: EntityFormState = {
  name: '',
  file: null,
};

const generateFilePath = (file: File) => {
  const extension = file.name.split('.').pop() ?? 'png';
  const randomPart = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return `logos/${randomPart}.${extension}`;
};

async function uploadLogo(file: File) {
  const path = generateFilePath(file);

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error("Impossible de récupérer l'URL publique du logo.");
  }

  return {
    logo_url: data.publicUrl,
    logo_path: path,
  };
}

async function removeLogo(path: string | null | undefined) {
  if (!path) return;

  const { error } = await supabase.storage
    .from(LOGO_BUCKET)
    .remove([path]);

  if (error) {
    console.error('Erreur lors de la suppression du logo:', error);
  }
}

export default function CompetentEntitiesManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState<EntityFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<ProgramCompetentEntity | null>(null);
  const [deleteEntity, setDeleteEntity] = useState<ProgramCompetentEntity | null>(null);

  const {
    data: entities,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['program_competent_entities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_competent_entities')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        toast.error("Erreur lors du chargement des instances compétentes");
        throw error;
      }

      return data as ProgramCompetentEntity[];
    },
  });

  const openCreateDialog = () => {
    setSelectedEntity(null);
    setFormState(initialFormState);
    setIsDialogOpen(true);
  };

  const openEditDialog = (entity: ProgramCompetentEntity) => {
    setSelectedEntity(entity);
    setFormState({
      name: entity.name,
      file: null,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setFormState(initialFormState);
    setSelectedEntity(null);
  };

  const handleSave = async () => {
    if (!formState.name.trim()) {
      toast.error('Le nom de l’instance est requis.');
      return;
    }

    setIsSubmitting(true);

    try {
      let logoData: { logo_url: string | null; logo_path: string | null } = {
        logo_url: selectedEntity?.logo_url ?? null,
        logo_path: selectedEntity?.logo_path ?? null,
      };

      if (formState.file) {
        logoData = await uploadLogo(formState.file);

        if (selectedEntity?.logo_path) {
          await removeLogo(selectedEntity.logo_path);
        }
      }

      if (selectedEntity) {
        const { error } = await supabase
          .from('program_competent_entities')
          .update({
            name: formState.name.trim(),
            logo_url: logoData.logo_url,
            logo_path: logoData.logo_path,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedEntity.id);

        if (error) throw error;

        toast.success('Instance compétente mise à jour avec succès.');
      } else {
        const { error } = await supabase
          .from('program_competent_entities')
          .insert([
            {
              name: formState.name.trim(),
              logo_url: logoData.logo_url,
              logo_path: logoData.logo_path,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);

        if (error) throw error;

        toast.success('Instance compétente créée avec succès.');
      }

      await refetch();
      closeDialog();
    } catch (error: any) {
      console.error('Erreur sauvegarde instance compétente:', error);
      toast.error(error.message ?? "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteEntity) return;

    try {
      const { error } = await supabase
        .from('program_competent_entities')
        .delete()
        .eq('id', deleteEntity.id);

      if (error) throw error;

      if (deleteEntity.logo_path) {
        await removeLogo(deleteEntity.logo_path);
      }

      toast.success('Instance compétente supprimée avec succès.');
      setDeleteEntity(null);
      await refetch();
    } catch (error: any) {
      console.error('Erreur suppression instance compétente:', error);
      toast.error(error.message ?? "Une erreur est survenue lors de la suppression.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Instances compétentes</CardTitle>
            <CardDescription>
              Gérez les niveaux (commune, intercommunalité, etc.) responsables de la mise en œuvre des mesures.
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle instance
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Chargement des instances compétentes...
          </div>
        ) : entities && entities.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Logo</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead className="w-[140px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.map((entity) => (
                <TableRow key={entity.id}>
                  <TableCell>
                    {entity.logo_url ? (
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-getigne-100 bg-white">
                        <img
                          src={entity.logo_url}
                          alt={entity.name}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            (event.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-getigne-200 text-getigne-400">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{entity.name}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(entity)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Modifier</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-500"
                        onClick={() => setDeleteEntity(entity)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="rounded-lg border border-dashed border-getigne-200 bg-getigne-50/40 p-8 text-center text-sm text-muted-foreground">
            Aucune instance compétente enregistrée pour le moment.
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEntity ? 'Modifier une instance compétente' : 'Créer une instance compétente'}
            </DialogTitle>
            <DialogDescription>
              Définissez le nom et le logo de l’entité responsable de la mise en œuvre.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="entity-name">Nom</Label>
              <Input
                id="entity-name"
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Ex: Gétigné"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity-logo">Logo (optionnel)</Label>
              <Input
                id="entity-logo"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setFormState((prev) => ({ ...prev, file }));
                }}
              />
              <p className="text-xs text-muted-foreground">
                Formats acceptés : PNG, JPG, SVG. Poids conseillé &lt; 1 Mo.
              </p>

              {(selectedEntity?.logo_url || formState.file) && (
                <div className="flex items-center gap-4">
                  {formState.file ? (
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-getigne-100 bg-white">
                      <img
                        src={URL.createObjectURL(formState.file)}
                        alt="Aperçu du nouveau logo"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : selectedEntity?.logo_url ? (
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-getigne-100 bg-white">
                      <img
                        src={selectedEntity.logo_url}
                        alt={`Logo actuel de ${selectedEntity.name}`}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          (event.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedEntity ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteEntity} onOpenChange={(open) => !open && setDeleteEntity(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette instance ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les points associés conserveront l’information mais sans logo ni nom liés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}



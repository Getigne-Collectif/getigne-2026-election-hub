import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconSelect } from '@/components/ui/icon-select';
import { GripVertical, Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import type { FAQCategory } from '@/types/faq.types';

interface FAQCategoryManagerProps {
  faqId: string;
  onCategoriesUpdated?: () => void;
}

export default function FAQCategoryManager({
  faqId,
  onCategoriesUpdated,
}: FAQCategoryManagerProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingIcon, setEditingIcon] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const { data: categories = [], isLoading } = useQuery<FAQCategory[]>({
    queryKey: ['faq-categories', faqId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq_categories')
        .select('*')
        .eq('faq_id', faqId)
        .order('position', { ascending: true });

      if (error) throw error;
      return (data || []) as FAQCategory[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; icon: string }) => {
      // Trouver la position maximale
      const maxPosition = categories.length > 0
        ? Math.max(...categories.map(c => c.position || 0))
        : -1;

      const { data: newCategory, error } = await supabase
        .from('faq_categories')
        .insert({
          faq_id: faqId,
          name: data.name,
          icon: data.icon || null,
          position: maxPosition + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return newCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-categories', faqId] });
      toast.success('Catégorie créée avec succès');
      onCategoriesUpdated?.();
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FAQCategory> }) => {
      const { error } = await supabase
        .from('faq_categories')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-categories', faqId] });
      toast.success('Catégorie mise à jour');
      setEditingId(null);
      setEditingName('');
      setEditingIcon('');
      onCategoriesUpdated?.();
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('faq_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-categories', faqId] });
      toast.success('Catégorie supprimée');
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      onCategoriesUpdated?.();
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (reordered: FAQCategory[]) => {
      const updates = reordered.map((cat, index) => ({
        id: cat.id,
        position: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('faq_categories')
          .update({ position: update.position })
          .eq('id', update.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-categories', faqId] });
      setIsReordering(false);
      onCategoriesUpdated?.();
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors du réordonnancement: ${error.message}`);
      setIsReordering(false);
    },
  });

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || !categories) return;
      if (result.destination.index === result.source.index) return;

      setIsReordering(true);
      const reordered = Array.from(categories);
      const [moved] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, moved);

      reorderMutation.mutate(reordered);
    },
    [categories, reorderMutation]
  );

  const startEdit = (category: FAQCategory) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingIcon(category.icon || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingIcon('');
  };

  const saveEdit = () => {
    if (!editingId || !editingName.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    updateMutation.mutate({
      id: editingId,
      data: {
        name: editingName.trim(),
        icon: editingIcon || null,
      },
    });
  };

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!categoryToDelete) return;
    deleteMutation.mutate(categoryToDelete);
  };

  const handleAddNew = () => {
    const name = prompt('Nom de la catégorie:');
    if (!name || !name.trim()) return;

    createMutation.mutate({
      name: name.trim(),
      icon: '',
    });
  };

  if (isLoading) {
    return <div className="text-center py-4">Chargement des catégories...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Catégories</h3>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une catégorie
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="faq-categories">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {categories.map((category, index) => (
                <Draggable key={category.id} draggableId={category.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`${snapshot.isDragging ? 'opacity-50' : ''} ${isReordering ? 'opacity-50' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div {...provided.dragHandleProps} className="cursor-grab">
                            <GripVertical className="w-5 h-5 text-gray-400" />
                          </div>

                          {editingId === category.id ? (
                            <>
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  placeholder="Nom de la catégorie"
                                />
                                <IconSelect
                                  value={editingIcon}
                                  onChange={setEditingIcon}
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={saveEdit}
                                disabled={updateMutation.isPending}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEdit}
                                disabled={updateMutation.isPending}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="flex-1">
                                <div className="font-medium">{category.name}</div>
                                {category.icon && (
                                  <div className="text-sm text-gray-500">Icône: {category.icon}</div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(category)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteClick(category.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera également toutes les questions/réponses de cette catégorie.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}



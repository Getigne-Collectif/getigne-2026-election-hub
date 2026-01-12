import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EditorJSComponent from '@/components/EditorJSComponent';
import { GripVertical, Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { FAQItem, FAQItemStatus } from '@/types/faq.types';
import type { OutputData } from '@editorjs/editorjs';

interface FAQItemManagerProps {
  categoryId: string;
  onItemsUpdated?: () => void;
}

export default function FAQItemManager({
  categoryId,
  onItemsUpdated,
}: FAQItemManagerProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState('');
  const [editingAnswer, setEditingAnswer] = useState<OutputData | string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery<FAQItem[]>({
    queryKey: ['faq-items', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .eq('faq_category_id', categoryId)
        .order('position', { ascending: true });

      if (error) throw error;
      return (data || []) as FAQItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { question: string; answer: OutputData }) => {
      // Trouver la position maximale
      const maxPosition = items.length > 0
        ? Math.max(...items.map(i => i.position || 0))
        : -1;

      const { data: newItem, error } = await supabase
        .from('faq_items')
        .insert({
          faq_category_id: categoryId,
          question: data.question,
          answer: data.answer as any,
          status: 'draft',
          position: maxPosition + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return newItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-items', categoryId] });
      toast.success('Question/réponse créée avec succès');
      onItemsUpdated?.();
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FAQItem> }) => {
      const { error } = await supabase
        .from('faq_items')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-items', categoryId] });
      toast.success('Question/réponse mise à jour');
      setEditingId(null);
      setEditingQuestion('');
      setEditingAnswer('');
      setIsEditDialogOpen(false);
      onItemsUpdated?.();
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('faq_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-items', categoryId] });
      toast.success('Question/réponse supprimée');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      onItemsUpdated?.();
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (reordered: FAQItem[]) => {
      const updates = reordered.map((item, index) => ({
        id: item.id,
        position: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('faq_items')
          .update({ position: update.position })
          .eq('id', update.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-items', categoryId] });
      setIsReordering(false);
      onItemsUpdated?.();
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors du réordonnancement: ${error.message}`);
      setIsReordering(false);
    },
  });

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || !items) return;
      if (result.destination.index === result.source.index) return;

      setIsReordering(true);
      const reordered = Array.from(items);
      const [moved] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, moved);

      reorderMutation.mutate(reordered);
    },
    [items, reorderMutation]
  );

  const startEdit = (item: FAQItem) => {
    setEditingId(item.id);
    setEditingQuestion(item.question);
    setEditingAnswer(item.answer);
    setIsEditDialogOpen(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingQuestion('');
    setEditingAnswer('');
    setIsEditDialogOpen(false);
  };

  const saveEdit = () => {
    if (!editingId || !editingQuestion.trim()) {
      toast.error('La question est requise');
      return;
    }

    if (!editingAnswer) {
      toast.error('La réponse est requise');
      return;
    }

    updateMutation.mutate({
      id: editingId,
      data: {
        question: editingQuestion.trim(),
        answer: editingAnswer as any,
      },
    });
  };

  const handleStatusChange = async (itemId: string, newStatus: FAQItemStatus) => {
    try {
      const { error } = await supabase
        .from('faq_items')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);
        
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['faq-items', categoryId] });
      
      const statusLabels: Record<FAQItemStatus, string> = {
        draft: 'Brouillon',
        pending: 'À valider',
        validated: 'Validé'
      };
      toast.success(`Statut mis à jour vers "${statusLabels[newStatus]}"`);
      onItemsUpdated?.();
    } catch (error: any) {
      toast.error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    deleteMutation.mutate(itemToDelete);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setEditingQuestion('');
    setEditingAnswer('');
    setIsEditDialogOpen(true);
  };

  const handleSaveNew = () => {
    if (!editingQuestion.trim()) {
      toast.error('La question est requise');
      return;
    }

    if (!editingAnswer) {
      toast.error('La réponse est requise');
      return;
    }

    const answerData = typeof editingAnswer === 'string' 
      ? (editingAnswer.trim() ? JSON.parse(editingAnswer) : { blocks: [], version: '2.24.3' })
      : editingAnswer;

    createMutation.mutate({
      question: editingQuestion.trim(),
      answer: answerData,
    });

    setEditingQuestion('');
    setEditingAnswer('');
    setIsEditDialogOpen(false);
  };

  if (isLoading) {
    return <div className="text-center py-4">Chargement des questions/réponses...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Questions / Réponses</h3>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une question
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="faq-items">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`${snapshot.isDragging ? 'opacity-50' : ''} ${isReordering ? 'opacity-50' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div {...provided.dragHandleProps} className="cursor-grab mt-1">
                            <GripVertical className="w-5 h-5 text-gray-400" />
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="font-medium">{item.question}</div>
                            <StatusBadge
                              status={item.status as FAQItemStatus}
                              onStatusChange={(newStatus) => handleStatusChange(item.id, newStatus as FAQItemStatus)}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(item)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteClick(item.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
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

      {/* Dialog pour créer/éditer */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Modifier la question/réponse' : 'Nouvelle question/réponse'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Question *</label>
              <Input
                value={editingQuestion}
                onChange={(e) => setEditingQuestion(e.target.value)}
                placeholder="Votre question..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Réponse *</label>
              <EditorJSComponent
                value={editingAnswer}
                onChange={(data) => setEditingAnswer(data)}
                placeholder="Rédigez la réponse..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEdit}>
                Annuler
              </Button>
              <Button
                onClick={editingId ? saveEdit : handleSaveNew}
                disabled={updateMutation.isPending || createMutation.isPending}
              >
                {editingId ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la question/réponse ?</AlertDialogTitle>
            <AlertDialogDescription>
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



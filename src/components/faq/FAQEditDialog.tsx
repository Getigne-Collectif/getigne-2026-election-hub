import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FAQForm, { FAQFormValues } from '@/components/admin/faq/FAQForm';
import FAQCategoryManager from '@/components/admin/faq/FAQCategoryManager';
import FAQItemManager from '@/components/admin/faq/FAQItemManager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { FAQ, FAQCategory } from '@/types/faq.types';

interface FAQEditDialogProps {
  faqId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function FAQItemsByCategory({ faqId }: { faqId: string }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<FAQCategory[]>({
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

  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  if (isLoadingCategories) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand mx-auto" />
        <p className="text-sm text-muted-foreground mt-2">Chargement des catégories...</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aucune catégorie créée. Créez d'abord une catégorie dans l'onglet "Catégories".</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Sélectionner une catégorie</label>
        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choisissez une catégorie..." />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCategoryId && (
        <FAQItemManager
          categoryId={selectedCategoryId}
          onItemsUpdated={() => {
            // Optionnel: rafraîchir les données
          }}
        />
      )}
    </div>
  );
}

export default function FAQEditDialog({
  faqId,
  open,
  onOpenChange,
  onSuccess,
}: FAQEditDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const { data: faq, isLoading } = useQuery<FAQ>({
    queryKey: ['faq', faqId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('id', faqId)
        .single();

      if (error) throw error;
      return data as FAQ;
    },
    enabled: open && !!faqId,
  });

  const handleSubmit = async (values: FAQFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('faqs')
        .update({
          name: values.name,
          slug: values.slug,
          updated_at: new Date().toISOString(),
        })
        .eq('id', faqId);

      if (error) throw error;
      
      toast.success('FAQ mise à jour avec succès');
      
      // Invalider les caches pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['faq', faqId] });
      queryClient.invalidateQueries({ queryKey: ['faq'] });
      
      onSuccess?.();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDefaultValues = (): Partial<FAQFormValues> | undefined => {
    if (!faq) return undefined;
    return {
      name: faq.name,
      slug: faq.slug,
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la FAQ</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-brand mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Chargement de la FAQ...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="mb-6">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="categories">Catégories</TabsTrigger>
              <TabsTrigger value="items">Questions / Réponses</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <FAQForm
                defaultValues={getDefaultValues()}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitLabel="Mettre à jour"
                showCancelButton={false}
              />
            </TabsContent>

            <TabsContent value="categories">
              <FAQCategoryManager
                faqId={faqId}
                onCategoriesUpdated={() => {
                  queryClient.invalidateQueries({ queryKey: ['faq-categories', faqId] });
                }}
              />
            </TabsContent>

            <TabsContent value="items">
              <FAQItemsByCategory faqId={faqId} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}



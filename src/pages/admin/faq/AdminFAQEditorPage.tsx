import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FAQForm, { FAQFormValues } from '@/components/admin/faq/FAQForm';
import FAQCategoryManager from '@/components/admin/faq/FAQCategoryManager';
import FAQItemManager from '@/components/admin/faq/FAQItemManager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FAQ, FAQCategory } from '@/types/faq.types';
import { Routes, generateRoutes } from '@/routes';

function FAQItemsByCategory({ faqId }: { faqId: string }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const { data: categories = [] } = useQuery<FAQCategory[]>({
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

export default function AdminFAQEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [faqId, setFaqId] = useState<string | null>(id || null);

  const { data: faq, isLoading } = useQuery<FAQ>({
    queryKey: ['faq', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as FAQ;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (faq) {
      setFaqId(faq.id);
    }
  }, [faq]);

  const handleSubmit = async (values: FAQFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        // Mise à jour
        const { error } = await supabase
          .from('faqs')
          .update({
            name: values.name,
            slug: values.slug,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
        toast.success('FAQ mise à jour avec succès');
      } else {
        // Création
        const { data, error } = await supabase
          .from('faqs')
          .insert({
            name: values.name,
            slug: values.slug,
          })
          .select()
          .single();

        if (error) throw error;
        toast.success('FAQ créée avec succès');
        setFaqId(data.id);
        // Rediriger vers la page d'édition avec le nouvel ID
        navigate(generateRoutes.adminFaqEdit(data.id), { replace: true });
        setActiveTab('categories');
      }
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

  if (isEditMode && isLoading) {
    return (
      <AdminLayout title="Chargement...">
        <div className="text-center py-8">Chargement de la FAQ...</div>
      </AdminLayout>
    );
  }

  if (isEditMode && !faq) {
    return (
      <AdminLayout title="FAQ non trouvée">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">FAQ non trouvée</p>
          <Button asChild>
            <Link to={Routes.ADMIN_FAQ}>Retour à la liste</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      backLink={
        <Button variant="outline" size="sm" className="mb-6" asChild>
          <Link to={Routes.ADMIN_FAQ}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux FAQ
          </Link>
        </Button>
      }
      title={isEditMode ? "Modifier la FAQ" : "Créer une FAQ"}
      description="Gérez les FAQ du site"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Détails</TabsTrigger>
          {faqId && (
            <>
              <TabsTrigger value="categories">Catégories</TabsTrigger>
              <TabsTrigger value="items">Questions / Réponses</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="details">
          <FAQForm
            defaultValues={getDefaultValues()}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel={isEditMode ? "Mettre à jour" : "Créer la FAQ"}
            showCancelButton={false}
          />
        </TabsContent>

        {faqId && (
          <>
            <TabsContent value="categories">
              <FAQCategoryManager
                faqId={faqId}
                onCategoriesUpdated={() => {
                  // Optionnel: rafraîchir les données
                }}
              />
            </TabsContent>

            <TabsContent value="items">
              <FAQItemsByCategory faqId={faqId} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </AdminLayout>
  );
}


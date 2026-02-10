import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HelpCircle, Edit } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import EditorJSRenderer from '@/components/EditorJSRenderer';
import FAQEditDialog from './FAQEditDialog';
import type { FAQWithCategories } from '@/types/faq.types';
import { useAuth } from '@/context/auth';
import AskQuestionForm from './AskQuestionForm';

interface FAQDisplayProps {
  slug: string;
  showDraft?: boolean;
}

const FAQDisplay: React.FC<FAQDisplayProps> = ({ slug, showDraft = false }) => {
  const { isAdmin, isModerator } = useAuth();
  const queryClient = useQueryClient();
  const canEdit = isAdmin || isModerator;
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: faq, isLoading, error } = useQuery<FAQWithCategories>({
    queryKey: ['faq', slug, showDraft],
    queryFn: async () => {
      const { data: faqData, error: faqError } = await supabase
        .from('faqs')
        .select('*, faq_categories(*, faq_items(*))')
        .eq('slug', slug)
        .single();

      if (faqError) throw faqError;
      if (!faqData) throw new Error('FAQ non trouvée');

      const sortedCategories = (faqData.faq_categories || []).map((category: any) => {
        const sortedItems = (category.faq_items || [])
          .sort((a: any, b: any) => a.position - b.position);
        
        const filteredItems = showDraft || canEdit
          ? sortedItems
          : sortedItems.filter((item: any) => item.status === 'validated');

        return { ...category, faq_items: filteredItems };
      }).sort((a: any, b: any) => a.position - b.position);

      return { ...faqData, faq_categories: sortedCategories } as FAQWithCategories;
    },
  });

  if (isLoading) return <FAQSkeleton />;
  if (error || !faq) return <FAQError />;

  const hasContent = faq.faq_categories.some(cat => cat.faq_items && cat.faq_items.length > 0);

  return (
    <div className="py-12 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-900 tracking-tight">
              {faq.name || 'Questions Fréquentes'}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Trouvez les réponses aux questions les plus courantes.
            </p>
          </div>

          {canEdit && faq.id && (
            <div className="text-center mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                className="group"
              >
                <Edit className="w-4 h-4 mr-2 text-gray-500 group-hover:text-brand transition-colors" />
                <span className="text-gray-700 group-hover:text-brand transition-colors">
                  Éditer la FAQ
                </span>
              </Button>
            </div>
          )}
          
          {hasContent ? (
            <div className="space-y-8">
              {faq.faq_categories.map((category) => {
                if (!category.faq_items || category.faq_items.length === 0) return null;

                return (
                  <div key={category.id}>
                    <h3 className="text-2xl font-bold text-brand-800 mb-6 flex items-center gap-3">
                      {category.icon && (
                        <DynamicIcon 
                          name={category.icon} 
                          className="w-7 h-7 text-brand" 
                        />
                      )}
                      <span>{category.name}</span>
                    </h3>
                    <Accordion type="single" collapsible className="w-full space-y-3">
                      {category.faq_items.map((item) => (
                        <AccordionItem
                          key={item.id}
                          value={`faq-item-${item.id}`}
                          className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                          <AccordionTrigger className="w-full text-left font-semibold text-lg text-brand-900 px-6 py-4 hover:no-underline group">
                            <span className="flex-grow">{item.question}</span>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-4 pt-0 text-gray-700 leading-relaxed">
                            <div className="prose max-w-none">
                              <EditorJSRenderer data={item.answer} />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 px-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">Aucune question pour le moment</h3>
              <p className="text-gray-600 mt-2">
                Cette section est encore vide. N'hésitez pas à poser la première question !
              </p>
            </div>
          )}

          <div className="mt-16 pt-12 border-t border-gray-200">
            <div className="text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-brand-900">
                Vous ne trouvez pas votre réponse ?
              </h3>
              <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
                Posez-nous directement votre question. Nous sommes là pour vous aider et nous vous répondrons rapidement.
              </p>
            </div>
            <div className="mt-8 max-w-2xl mx-auto">
                <AskQuestionForm />
            </div>
          </div>

        </div>
      </div>
      
      {canEdit && faq.id && (
        <FAQEditDialog
          faqId={faq.id}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['faq', slug] })}
        />
      )}
    </div>
  );
};

const FAQSkeleton = () => (
  <div className="container mx-auto px-4 py-12 md:py-20">
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="h-10 bg-gray-200 rounded-md w-1/2 mx-auto animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded-md w-3/4 mx-auto mt-4 animate-pulse"></div>
      </div>
      <div className="space-y-8">
        {[1, 2].map(i => (
          <div key={i}>
            <div className="h-8 bg-gray-200 rounded-md w-1/3 mb-6 animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(j => (
                <div key={j} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const FAQError = () => (
  <div className="container mx-auto px-4 py-12 md:py-20">
    <div className="max-w-4xl mx-auto text-center">
       <h2 className="text-3xl md:text-4xl font-extrabold text-red-600 tracking-tight">
        Erreur
      </h2>
      <p className="mt-4 text-lg text-gray-600">
        Impossible de charger les questions fréquentes. Veuillez réessayer plus tard.
      </p>
    </div>
  </div>
);

export default FAQDisplay;

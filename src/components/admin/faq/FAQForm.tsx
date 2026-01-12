import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { FAQ } from '@/types/faq.types';

export const faqSchema = z.object({
  name: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
  slug: z.string().min(2, "Le slug doit comporter au moins 2 caractères").regex(
    /^[a-z0-9-]+$/,
    "Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets"
  ),
});

export type FAQFormValues = z.infer<typeof faqSchema>;

interface FAQFormProps {
  defaultValues?: Partial<FAQFormValues>;
  onSubmit: (values: FAQFormValues) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  showCancelButton?: boolean;
}

export default function FAQForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Enregistrer",
  cancelLabel = "Annuler",
  showCancelButton = true,
}: FAQFormProps) {
  const form = useForm<FAQFormValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      name: '',
      slug: '',
      ...defaultValues,
    },
  });

  // Générer le slug depuis le nom si le slug est vide
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères non alphanumériques par des tirets
      .replace(/^-+|-+$/g, ''); // Supprimer les tirets en début et fin
  };

  const handleNameChange = (value: string) => {
    form.setValue('name', value);
    // Générer le slug automatiquement si le slug est vide ou identique à l'ancien nom
    const currentSlug = form.getValues('slug');
    if (!currentSlug || currentSlug === generateSlug(form.getValues('name') || '')) {
      form.setValue('slug', generateSlug(value));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la FAQ *</FormLabel>
              <FormControl>
                <Input
                  placeholder="FAQ Programme"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleNameChange(e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Le nom affiché de la FAQ
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (URL) *</FormLabel>
              <FormControl>
                <Input
                  placeholder="faq-programme"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Identifiant unique pour la FAQ dans l'URL (lettres minuscules, chiffres et tirets uniquement)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          {showCancelButton && onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}



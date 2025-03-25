
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  parent_id: string | null;
  status: string;
}

export const pageFormSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  slug: z.string().min(2, "L'URL doit contenir au moins 2 caractères")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "L'URL ne peut contenir que des lettres minuscules, des chiffres et des tirets"),
  content: z.string().min(10, "Le contenu doit contenir au moins 10 caractères"),
  parent_id: z.string().nullable(),
});

export type FormValues = z.infer<typeof pageFormSchema>;

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
    .trim();
};

export const usePageEditor = (id?: string) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      parent_id: null,
    },
  });

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('title');

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des pages:', error);
    }
  };

  const fetchPage = async (pageId: string) => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (error) throw error;

      form.reset({
        title: data.title,
        slug: data.slug,
        content: data.content,
        parent_id: data.parent_id,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la page:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les détails de la page.',
        variant: 'destructive'
      });
      navigate('/admin/pages');
    }
  };

  useEffect(() => {
    fetchPages();
    if (isEditMode && id) {
      fetchPage(id);
    } else {
      form.reset({
        title: "",
        slug: "",
        content: "",
        parent_id: null,
      });
    }
  }, [id, isEditMode]);

  const handleSaveAsDraft = async (values: FormValues) => {
    await handleSubmit(values, 'draft');
  };

  const handlePublish = async (values: FormValues) => {
    await handleSubmit(values, 'published');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setValue('title', title);
    
    if (!form.getValues('slug') || form.getValues('slug') === generateSlug(form.getValues('title'))) {
      form.setValue('slug', generateSlug(title));
    }
  };

  const handleSubmit = async (values: FormValues, status: 'draft' | 'published') => {
    setIsSubmitting(true);
    try {
      if (isEditMode && values.parent_id === id) {
        toast({
          title: "Erreur",
          description: "Une page ne peut pas être son propre parent.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const { data: existingPages, error: slugCheckError } = await supabase
        .from('pages')
        .select('id, slug')
        .eq('slug', values.slug);

      if (slugCheckError) throw slugCheckError;

      const slugExists = existingPages && existingPages.length > 0 && 
        (!isEditMode || existingPages.some(page => page.id !== id));

      if (slugExists) {
        form.setError('slug', { message: 'Cette URL est déjà utilisée par une autre page' });
        setIsSubmitting(false);
        return;
      }

      const formData = {
        title: values.title,
        slug: values.slug,
        content: values.content,
        parent_id: values.parent_id || null,
        status
      };

      console.log('Saving page with data:', formData);

      if (isEditMode && id) {
        const { error } = await supabase
          .from('pages')
          .update(formData)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Page mise à jour",
          description: status === 'published'
            ? "La page a été publiée avec succès"
            : "La page a été enregistrée comme brouillon",
        });
      } else {
        const { error, data } = await supabase
          .from('pages')
          .insert([formData])
          .select();

        if (error) throw error;

        console.log('Page created successfully:', data);

        toast({
          title: "Page créée",
          description: status === 'published'
            ? "La page a été publiée avec succès"
            : "La page a été enregistrée comme brouillon",
        });
      }

      navigate('/admin/pages');
    } catch (error: any) {
      console.error("Error saving page:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'enregistrement de la page",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    pages,
    isEditMode,
    isSubmitting,
    handleTitleChange,
    handleSaveAsDraft,
    handlePublish
  };
};

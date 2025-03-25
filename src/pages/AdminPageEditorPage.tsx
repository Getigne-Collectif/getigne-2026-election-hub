
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Home, ArrowLeft, Save, Send } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import MarkdownEditor from '@/components/MarkdownEditor';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  parent_id: string | null;
  status: string;
}

const pageFormSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  slug: z.string().min(2, "L'URL doit contenir au moins 2 caractères")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "L'URL ne peut contenir que des lettres minuscules, des chiffres et des tirets"),
  content: z.string().min(10, "Le contenu doit contenir au moins 10 caractères"),
  parent_id: z.string().nullable(),
});

type FormValues = z.infer<typeof pageFormSchema>;

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
    .trim();
};

const AdminPageEditorPage = () => {
  const { id } = useParams();
  const { user, isAdmin, authChecked } = useAuth();
  const navigate = useNavigate();
  const [pages, setPages] = useState<Page[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!id;

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

  useEffect(() => {
    if (!authChecked) return;

    if (!user) {
      toast({
        title: 'Accès refusé',
        description: "Veuillez vous connecter pour accéder à cette page.",
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    if (user && !isAdmin) {
      toast({
        title: 'Accès refusé',
        description: "Vous n'avez pas les droits d'accès à cette page.",
        variant: 'destructive'
      });
      navigate('/');
      return;
    }

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
  }, [user, isAdmin, authChecked, navigate, id, isEditMode]);

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

  const handleSaveAsDraft = async (values: FormValues) => {
    await handleSubmit(values, 'draft');
  };

  const handlePublish = async (values: FormValues) => {
    await handleSubmit(values, 'published');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setValue('title', title);
    
    // Only auto-generate slug if the slug is empty or hasn't been manually edited
    if (!form.getValues('slug') || form.getValues('slug') === generateSlug(form.getValues('title'))) {
      form.setValue('slug', generateSlug(title));
    }
  };

  const handleSubmit = async (values: FormValues, status: 'draft' | 'published') => {
    setIsSubmitting(true);
    try {
      // Check if the parent ID would create a circular reference
      if (isEditMode && values.parent_id === id) {
        toast({
          title: "Erreur",
          description: "Une page ne peut pas être son propre parent.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Check if slug is unique
      const { data: existingPage, error: slugCheckError } = await supabase
        .from('pages')
        .select('id')
        .eq('slug', values.slug)
        .not('id', isEditMode ? id : '');

      if (slugCheckError) throw slugCheckError;

      if (existingPage && existingPage.length > 0) {
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
        const { error } = await supabase
          .from('pages')
          .insert([formData]);

        if (error) throw error;

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

  return (
    <AdminLayout>
      <div className="pt-8 pb-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Home className="h-4 w-4 mr-1" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Administration</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/pages">Pages</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>{isEditMode ? "Modifier la page" : "Nouvelle page"}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-4">
          <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/pages')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">{isEditMode ? "Modifier la page" : "Créer une page"}</h1>
        </div>
      </div>

      <div className="py-8">
        <Form {...form}>
          <form>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xl font-bold">Titre</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Titre de la page"
                          className="text-lg p-3"
                          {...field}
                          onChange={handleTitleChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xl font-bold">Contenu</FormLabel>
                      <FormControl>
                        <MarkdownEditor
                          value={field.value}
                          onChange={field.onChange}
                          className="min-h-[600px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-getigne-100 p-6 space-y-6 sticky top-24">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">Paramètres de publication</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={form.handleSubmit(handleSaveAsDraft)}
                        disabled={isSubmitting}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Brouillon
                      </Button>
                      <Button
                        onClick={form.handleSubmit(handlePublish)}
                        disabled={isSubmitting}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Publier
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">/</span>
                          <FormControl>
                            <Input
                              placeholder="url-de-la-page"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parent_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Page parente</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Aucun parent" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Aucun parent</SelectItem>
                              {pages
                                .filter(page => isEditMode ? page.id !== id : true)
                                .map(page => (
                                  <SelectItem key={page.id} value={page.id}>
                                    {page.title}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
};

export default AdminPageEditorPage;

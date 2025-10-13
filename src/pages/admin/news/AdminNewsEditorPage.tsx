import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, generatePath } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.tsx';
import { supabase } from '@/integrations/supabase/client.ts';
import Navbar from '@/components/Navbar.tsx';
import Footer from '@/components/Footer.tsx';
import { toast } from '@/components/ui/use-toast.ts';

import { Home, ArrowLeft, Save, Send, Image, Calendar, Tag, MessageSquare, X, Eye } from "lucide-react";
import { Input } from '@/components/ui/input.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import EditorJSComponent from '@/components/EditorJSComponent.tsx';
import { OutputData } from '@editorjs/editorjs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar.tsx";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx';
import { Switch } from "@/components/ui/switch.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { cn } from '@/lib/utils.ts';
import {Helmet, HelmetProvider} from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout.tsx";
import { Routes } from '@/routes';

interface NewsFormValues {
  title: string;
  slug: string;
  excerpt: string;
  content: string | OutputData;
  category_id: string;
  image: string | File;
  tags: string[];
  author_id?: string;
  publication_date?: string;
  comments_enabled?: boolean;
}

const newsFormSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  slug: z.string().min(3, "Le slug doit contenir au moins 3 caractères").regex(/^[a-z0-9-]+$/, "Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets"),
  excerpt: z.string().min(10, "Le résumé doit contenir au moins 10 caractères"),
  content: z.union([
    z.string().min(50, "Le contenu doit contenir au moins 50 caractères"),
    z.object({
      time: z.number().optional(),
      blocks: z.array(z.any()).min(1, "Le contenu doit contenir au moins un bloc"),
      version: z.string().optional()
    })
  ]),
  category_id: z.string().min(2, "La catégorie est requise"),
  image: z.any(),
  tags: z.array(z.string()).default([]),
  author_id: z.string().optional(),
  publication_date: z.date().optional(),
  comments_enabled: z.boolean().default(true),
});

type FormValues = z.infer<typeof newsFormSchema>;

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

const AdminNewsEditorPage = () => {
  const { id } = useParams();
  const { user, isAdmin, loading, authChecked } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [users, setUsers] = useState<{id: string, first_name: string, last_name: string, avatar_url?: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [availableTags, setAvailableTags] = useState<{id: string, name: string}[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'draft' | 'published'>('draft');
  const [articleSlug, setArticleSlug] = useState<string>('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const isEditMode = !!id;

  const form = useForm<FormValues>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category_id: "",
      image: undefined,
      tags: [],
      author_id: "",
      publication_date: new Date(),
      comments_enabled: true,
    },
  });

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('news_categories')
        .select('id, name');

      if (error) throw error;
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('news_tags')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setAvailableTags(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des tags:', error);
    }
  };

  const fetchArticle = async (articleId: string) => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', articleId)
        .single();

      if (error) throw error;

      const { data: tagData, error: tagError } = await supabase
        .from('news_to_tags')
        .select('news_tags(id, name)')
        .eq('news_id', articleId);

      if (tagError) throw tagError;

      const articleTags = tagData.map(item => item.news_tags.name);

      setImagePreview(data.image);
      setSelectedTags(articleTags);
      setCurrentStatus((data.status === 'published' ? 'published' : 'draft') as 'draft' | 'published');
      setArticleSlug(data.slug || data.id);

      let contentValue: string | OutputData = data.content;
      
      if (typeof data.content === 'string') {
        try {
          const parsed = JSON.parse(data.content);
          if (parsed.blocks && Array.isArray(parsed.blocks)) {
            contentValue = parsed;
          }
        } catch (e) {
          contentValue = data.content;
        }
      }

      form.reset({
        title: data.title,
        slug: data.slug || generateSlug(data.title),
        excerpt: data.excerpt,
        content: contentValue,
        category_id: data.category_id || "",
        image: data.image,
        tags: articleTags,
        author_id: data.author_id || "",
        publication_date: data.publication_date ? new Date(data.publication_date) : new Date(),
        comments_enabled: data.comments_enabled !== false,
      });
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'article:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les détails de l\'article.',
        variant: 'destructive'
      });
      navigate('/admin/news');
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

    // Ne charger les données qu'une seule fois
    if (isDataLoaded) return;

    fetchCategories();
    fetchUsers();
    fetchTags();

    if (isEditMode && id) {
      fetchArticle(id);
    } else {
      form.reset({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        category_id: "",
        image: undefined,
        tags: [],
        author_id: user?.id || "",
        publication_date: new Date(),
        comments_enabled: true,
      });
      setImagePreview(null);
      setSelectedTags([]);
    }
    
    setIsDataLoaded(true);
  }, [user, isAdmin, authChecked, navigate, id, isEditMode, isDataLoaded]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("image", file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      const updatedTags = [...selectedTags, newTag.trim()];
      setSelectedTags(updatedTags);
      form.setValue("tags", updatedTags);
      setNewTag('');
    }
  };

  const handleSelectExistingTag = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      const updatedTags = [...selectedTags, tagName];
      setSelectedTags(updatedTags);
      form.setValue("tags", updatedTags);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(updatedTags);
    form.setValue("tags", updatedTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError, data } = await supabase.storage
        .from('news_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('news_images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'image:', error);
      throw error;
    }
  };

  const handleSaveAsDraft = async (values: FormValues) => {
    await handleSubmit(values, 'draft');
  };

  const handlePublish = async (values: FormValues) => {
    await handleSubmit(values, 'published');
  };

  const handlePreview = () => {
    if (isEditMode && articleSlug) {
      const previewUrl = generatePath(Routes.NEWS_DETAIL, { slug: articleSlug });
      navigate(previewUrl);
    }
  };

  const handleSubmit = async (values: FormValues, status: 'draft' | 'published') => {
    setIsSubmitting(true);
    try {
      let imageUrl = typeof values.image === 'string' ? values.image : "";

      if (values.image instanceof File) {
        imageUrl = await uploadImage(values.image);
      }

      const contentString = typeof values.content === 'string' 
        ? values.content 
        : JSON.stringify(values.content);

      const formData: any = {
        title: values.title,
        excerpt: values.excerpt,
        content: contentString,
        category_id: values.category_id,
        category: categories.find(cat => cat.id === values.category_id)?.name || '',
        image: imageUrl,
        author_id: values.author_id || user?.id,
        publication_date: values.publication_date ? format(values.publication_date, 'yyyy-MM-dd') : undefined,
        comments_enabled: values.comments_enabled,
        slug: values.slug,
        status
      };

      if (isEditMode && id) {
        const { data, error } = await supabase
          .from('news')
          .update(formData)
          .eq('id', id)
          .select('id, slug');

        if (error) throw error;

        const { error: deleteTagsError } = await supabase
          .from('news_to_tags')
          .delete()
          .eq('news_id', id);

        if (deleteTagsError) throw deleteTagsError;

        if (selectedTags.length > 0) {
          for (const tagName of selectedTags) {
            let tagId;
            const { data: existingTag, error: tagFetchError } = await supabase
              .from('news_tags')
              .select('id')
              .eq('name', tagName)
              .maybeSingle();

            if (tagFetchError) throw tagFetchError;

            if (existingTag) {
              tagId = existingTag.id;
            } else {
              const { data: newTag, error: createTagError } = await supabase
                .from('news_tags')
                .insert({ name: tagName })
                .select('id')
                .single();

              if (createTagError) throw createTagError;
              tagId = newTag.id;
            }

            const { error: linkError } = await supabase
              .from('news_to_tags')
              .insert({
                news_id: id,
                tag_id: tagId
              });

            if (linkError) throw linkError;
          }
        }

        toast({
          title: "Article mis à jour",
          description: status === 'published'
            ? "L'article a été publié avec succès"
            : "L'article a été enregistré comme brouillon",
        });

        setCurrentStatus(status);
        if (data && data.length > 0) {
          setArticleSlug(data[0].slug || data[0].id);
        }

        if (status === 'published' && data && data.length > 0) {
          const articleData = data[0];
          const articleSlug = articleData.slug || articleData.id;
          const redirectUrl = generatePath(Routes.NEWS_DETAIL, { slug: articleSlug });
          navigate(redirectUrl);
          return;
        }
      } else {
        formData.date = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('news')
          .insert(formData)
          .select('id, slug');

        if (error) throw error;

        const articleId = data[0].id;

        if (selectedTags.length > 0) {
          for (const tagName of selectedTags) {
            let tagId;
            const { data: existingTag, error: tagFetchError } = await supabase
              .from('news_tags')
              .select('id')
              .eq('name', tagName)
              .maybeSingle();

            if (tagFetchError) throw tagFetchError;

            if (existingTag) {
              tagId = existingTag.id;
            } else {
              const { data: newTag, error: createTagError } = await supabase
                .from('news_tags')
                .insert({ name: tagName })
                .select('id')
                .single();

              if (createTagError) throw createTagError;
              tagId = newTag.id;
            }

            const { error: linkError } = await supabase
              .from('news_to_tags')
              .insert({
                news_id: articleId,
                tag_id: tagId
              });

            if (linkError) throw linkError;
          }
        }

        toast({
          title: "Article créé",
          description: status === 'published'
            ? "L'article a été publié avec succès"
            : "L'article a été enregistré comme brouillon",
        });

        setCurrentStatus(status);
        if (data && data.length > 0) {
          setArticleSlug(data[0].slug || data[0].id);
        }

        if (status === 'published' && data && data.length > 0) {
          const articleData = data[0];
          const articleSlug = articleData.slug || articleData.id;
          const redirectUrl = generatePath(Routes.NEWS_DETAIL, { slug: articleSlug });
          navigate(redirectUrl);
          return;
        }
      }

      navigate('/admin/news');
    } catch (error: any) {
      console.error("Error saving news article:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'enregistrement de l'article",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <HelmetProvider>
        <Helmet>
          <title>{isEditMode ? "Modifier l'article" : "Créer un article"} | Admin | Gétigné Collectif</title>
        </Helmet>

        <AdminLayout backLink={<div className="flex items-center gap-4 my-4">
          <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/news')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">{isEditMode ? "Modifier l'article" : "Créer un article"}</h1>
        </div>}>

          <div className="container mx-auto px-4 py-8">
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
                          placeholder="Titre de l'article"
                          className="text-lg p-3"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (!isEditMode || !form.getValues('slug')) {
                              form.setValue('slug', generateSlug(e.target.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="slug-de-larticle"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-sm text-gray-500 mt-1">
                        URL de l'article : /news/{field.value || 'slug-de-larticle'}
                      </p>
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
                        <EditorJSComponent
                          key={id || 'new'}
                          value={field.value as string | OutputData}
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
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg">Paramètres de publication</h3>
                    
                    {currentStatus === 'draft' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-sm text-yellow-800">
                          Cet article est en brouillon et n'est pas visible publiquement.
                        </p>
                      </div>
                    )}
                    
                    {currentStatus === 'published' && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <p className="text-sm text-green-800">
                          Cet article est publié et visible publiquement.
                        </p>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={form.handleSubmit(currentStatus === 'draft' ? handleSaveAsDraft : handlePublish)}
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                      
                      {currentStatus === 'draft' && (
                        <Button
                          onClick={form.handleSubmit(handlePublish)}
                          disabled={isSubmitting}
                          variant="default"
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Publier l'article
                        </Button>
                      )}
                      
                      {isEditMode && articleSlug && (
                        <Button
                          type="button"
                          onClick={handlePreview}
                          variant="outline"
                          className="w-full"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Aperçu
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Résumé</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Résumé de l'article"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <div className="mt-2">
                      <div className="flex items-center gap-3">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md border-gray-300 cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Image className="w-8 h-8 mb-3 text-gray-400" />
                            <p className="text-sm text-gray-500">Cliquez pour télécharger</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                      {imagePreview && (
                        <div className="mt-4 relative">
                          <img
                            src={imagePreview}
                            alt="Aperçu"
                            className="w-full h-48 rounded-md object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              form.setValue("image", "");
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="author_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auteur</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un auteur" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.first_name} {user.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Tags</FormLabel>
                    <div className="mt-2">
                      <Select onValueChange={handleSelectExistingTag}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un tag existant" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTags
                            .filter(tag => !selectedTags.includes(tag.name))
                            .map(tag => (
                              <SelectItem key={tag.id} value={tag.name}>
                                {tag.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center mt-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ajouter un nouveau tag..."
                        className="mr-2"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddTag}
                      >
                        <Tag className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedTags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                          {tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="publication_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de publication</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP", { locale: fr })
                                ) : (
                                  <span>Choisir une date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comments_enabled"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Autoriser les commentaires</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
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
      </HelmetProvider>
  );
};

export default AdminNewsEditorPage;

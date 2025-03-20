import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from '@/components/ui/use-toast';
import { setupNewsImagesBucket } from '@/utils/setupNewsImages';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Home, ArrowLeft, Save, Send, Image, Calendar, Tag, MessageSquare, X } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

interface NewsFormValues {
  title: string;
  excerpt: string;
  content: string;
  category_id: string;
  image: string | File;
  tags: string[];
  author_id?: string;
  publication_date?: string;
  comments_enabled?: boolean;
}

const newsFormSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  excerpt: z.string().min(10, "Le résumé doit contenir au moins 10 caractères"),
  content: z.string().min(50, "Le contenu doit contenir au moins 50 caractères"),
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
  const isEditMode = !!id;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: {
      title: "",
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

  const fetchArticle = async (articleId: string) => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select(`*`)
        .eq('id', articleId)
        .single();

      if (error) throw error;

      setImagePreview(data.image);
      setSelectedTags(Array.isArray(data.tags) ? data.tags.map(tag => String(tag)) : []);

      form.reset({
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        category_id: data.category_id || "",
        image: data.image,
        tags: Array.isArray(data.tags) ? data.tags.map(tag => String(tag)) : [],
        author_id: data.author_id || "",
        publication_date: data.publication_date ? new Date(data.publication_date) : new Date(),
        comments_enabled: data.comments_enabled !== false,
      });
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

    setupNewsImagesBucket().catch(err => {
      console.error('Erreur lors de la configuration du bucket news_images:', err);
    });

    fetchCategories();
    fetchUsers();

    if (isEditMode && id) {
      fetchArticle(id);
    } else {
      form.reset({
        title: "",
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
  }, [user, isAdmin, authChecked, navigate, id, isEditMode]);

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

  const handleSubmit = async (values: FormValues, status: 'draft' | 'published') => {
    setIsSubmitting(true);
    try {
      let imageUrl = typeof values.image === 'string' ? values.image : "";
      
      if (values.image instanceof File) {
        imageUrl = await uploadImage(values.image);
      }

      const slug = generateSlug(values.title);

      const formData: any = {
        title: values.title,
        excerpt: values.excerpt,
        content: values.content,
        category_id: values.category_id,
        category: categories.find(cat => cat.id === values.category_id)?.name || '',
        image: imageUrl,
        tags: values.tags,
        author_id: values.author_id || user?.id,
        publication_date: values.publication_date ? format(values.publication_date, 'yyyy-MM-dd') : undefined,
        comments_enabled: values.comments_enabled,
        slug: slug,
        status
      };

      if (isEditMode && id) {
        const { data, error } = await supabase
          .from('news')
          .update(formData)
          .eq('id', id)
          .select('id, slug');

        if (error) throw error;

        toast({
          title: "Article mis à jour",
          description: status === 'published' 
            ? "L'article a été publié avec succès" 
            : "L'article a été enregistré comme brouillon",
        });
        
        if (status === 'published' && data && data.length > 0) {
          const articleData = data[0];
          const articleSlug = articleData.slug || articleData.id;
          const redirectUrl = `/actualites/${articleSlug}`;
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

        toast({
          title: "Article créé",
          description: status === 'published' 
            ? "L'article a été publié avec succès" 
            : "L'article a été enregistré comme brouillon",
        });
        
        if (status === 'published' && data && data.length > 0) {
          const articleData = data[0];
          const articleSlug = articleData.slug || articleData.id;
          const redirectUrl = `/actualites/${articleSlug}`;
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
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="pt-24 pb-8 bg-getigne-50">
        <div className="container mx-auto px-4">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">
                  <Home className="h-4 w-4 mr-1" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/news">Administration des actualités</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{isEditMode ? "Modifier l'article" : "Nouvel article"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/news')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold">{isEditMode ? "Modifier l'article" : "Créer un article"}</h1>
          </div>
        </div>
      </div>

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
                            defaultValue={field.value}
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
                            defaultValue={field.value}
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
                    <div className="flex items-center mt-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ajouter un tag..."
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

      <Footer />
    </div>
  );
};

export default AdminNewsEditorPage;

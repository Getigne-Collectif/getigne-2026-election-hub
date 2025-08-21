
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import type { Project } from '@/types/projects.types';

// Form schema
const projectSchema = z.object({
  title: z.string().min(2, { message: "Le titre doit comporter au moins 2 caractères." }),
  description: z.string().min(10, { message: "La description doit comporter au moins 10 caractères." }),
  image: z.string().optional(),
  contact_info: z.string().optional(),
  contact_email: z.string().email({ message: "Format d'email invalide" }).optional().or(z.literal('')),
  status: z.enum(["active", "draft"]),
  is_featured: z.boolean().default(false),
  url: z.string().url({ message: "L'URL doit être valide" }).optional().or(z.literal(''))
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function AdminProjectEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form setup
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      image: '',
      contact_info: '',
      contact_email: '',
      status: 'active',
      is_featured: false,
      url: ''
    }
  });
  
  // Fetch project data if editing
  const { isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        toast.error("Erreur lors du chargement du projet");
        throw error;
      }
      
      if (data) {
        // Type cast to Project
        const project = data as Project;
        
        // Set form values
        form.reset({
          title: project.title,
          description: project.description,
          image: project.image || '',
          contact_info: project.contact_info || '',
          contact_email: project.contact_email || '',
          status: project.status as "active" | "draft",
          is_featured: project.is_featured || false,
          url: project.url || ''
        });
        
        // Set image preview if exists
        if (project.image) {
          setImagePreview(project.image);
        }
      }
      
      return data as Project;
    },
    enabled: isEditing
  });

  // Handle form submission
  const onSubmit = async (values: ProjectFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Upload image if selected
      let imagePath = values.image;
      
      if (imageFile) {
        setIsUploading(true);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `projects/${fileName}`;
        
        console.log("Uploading file to:", filePath);
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('cms_assets')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          toast.error("Erreur lors de l'upload de l'image");
          console.error("Upload error:", uploadError);
          setIsSubmitting(false);
          setIsUploading(false);
          return;
        }
        
        console.log("Upload successful, data:", uploadData);
        
        const { data: publicUrl } = supabase.storage
          .from('cms_assets')
          .getPublicUrl(filePath);
          
        imagePath = publicUrl.publicUrl;
        console.log("Public URL:", imagePath);
        setIsUploading(false);
      }
      
      // Save project data
      const projectData = {
        title: values.title,
        description: values.description,
        image: imagePath,
        contact_info: values.contact_info,
        contact_email: values.contact_email,
        status: values.status,
        is_featured: values.is_featured,
        url: values.url,
        updated_at: new Date().toISOString()
      };
      
      let error;
      
      if (isEditing && id) {
        console.log("Updating project with ID:", id);
        console.log("Project data:", projectData);
        
        ({ error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', id));
      } else {
        console.log("Creating new project");
        console.log("Project data:", projectData);
        
        ({ error } = await supabase
          .from('projects')
          .insert([{
            ...projectData,
            created_at: new Date().toISOString()
          }]));
      }
      
      if (error) {
        toast.error(`Erreur lors de l'enregistrement du projet: ${error.message}`);
        console.error("Save error:", error);
        return;
      }
      
      toast.success(isEditing ? "Projet mis à jour avec succès" : "Projet créé avec succès");
      navigate('/admin/projects');
      
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(`Une erreur est survenue: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    setImageFile(file);
    
    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    
    return () => URL.revokeObjectURL(objectUrl);
  };
  
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setValue('image', '');
  };
  
  const pageTitleText = isEditing ? "Modifier un projet" : "Créer un projet";
  
  return (
    <AdminLayout
      backLink={
        <Button variant="outline" size="sm" className="mb-6" asChild>
          <Link to="/admin/projects">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste des projets
          </Link>
        </Button>
      }
      title={pageTitleText}
      description="Renseignez les informations du projet à afficher sur le site"
    >
      {isLoadingProject ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                  <CardDescription>
                    Les informations de base du projet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre</FormLabel>
                        <FormControl>
                          <Input placeholder="Titre du projet" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Description détaillée du projet" 
                            rows={5}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Décrivez le projet, son but et son fonctionnement
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL du projet (optionnel)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://exemple.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          L'URL du site web ou de la page du projet, si disponible
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Image</CardTitle>
                  <CardDescription>
                    Image représentative du projet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Input 
                        id="image" 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                      />
                      <FormDescription>
                        Format recommandé : JPEG ou PNG, dimension minimum 800x600px
                      </FormDescription>
                    </div>
                    
                    {imagePreview && (
                      <div className="relative w-full max-w-md">
                        <img 
                          src={imagePreview} 
                          alt="Prévisualisation" 
                          className="rounded-md border object-cover h-40 w-full"
                        />
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm" 
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          Supprimer
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Contact et paramètres</CardTitle>
                  <CardDescription>
                    Informations de contact et paramètres d'affichage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="contact_info"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Informations de contact</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nom ou fonction du contact" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email de contact</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="contact@exemple.fr" 
                            type="email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un statut" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="draft">Brouillon</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Les projets en brouillon ne sont pas affichés sur le site
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Mettre en avant</FormLabel>
                          <FormDescription>
                            Projet à mettre en avant sur la page d'accueil
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/admin/projects')}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || isUploading}
                >
                  {(isSubmitting || isUploading) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isUploading 
                        ? "Upload en cours..."
                        : isEditing 
                          ? "Mise à jour..." 
                          : "Création..."}
                    </>
                  ) : (
                    isEditing ? 'Mettre à jour' : 'Créer le projet'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </AdminLayout>
  );
}

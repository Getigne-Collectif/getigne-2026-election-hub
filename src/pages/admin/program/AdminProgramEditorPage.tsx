import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import MarkdownEditor from '@/components/MarkdownEditor';
import ProgramPointsEditor from '@/components/admin/program/ProgramPointsEditor';
import { IconSelect } from '@/components/ui/icon-select';
import { uploadProgramImage } from '@/components/admin/program/points/FileUploadService';

const programItemSchema = z.object({
  title: z.string().min(2, "Le titre doit comporter au moins 2 caractères"),
  description: z.string().min(10, "La description doit comporter au moins 10 caractères"),
  icon: z.string().optional(),
  image: z.string().optional(),
});

type ProgramItemFormValues = z.infer<typeof programItemSchema>;

export default function AdminProgramEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const form = useForm<ProgramItemFormValues>({
    resolver: zodResolver(programItemSchema),
    defaultValues: {
      title: '',
      description: '',
      icon: '',
      image: '',
    },
  });

  const { data: programItem, isLoading: isLoadingItem } = useQuery({
    queryKey: ['programItem', id],
    queryFn: async () => {
      if (!id) return null;
      
      console.log(`[ProgramEditor] Fetching program item with ID: ${id}`);
      
      const { data, error } = await supabase
        .from('program_items')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("[ProgramEditor] Error loading program item:", error);
        toast.error("Erreur lors du chargement de la section");
        throw error;
      }
      
      console.log("[ProgramEditor] Program item loaded:", data);
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (programItem) {
      console.log("[ProgramEditor] Setting form values from program item:", programItem);
      
      form.reset({
        title: programItem.title,
        description: programItem.description,
        icon: programItem.icon || '',
        image: programItem.image || '',
      });
      
      if (programItem.image) {
        console.log(`[ProgramEditor] Setting image preview from existing image: ${programItem.image}`);
        setImagePreview(programItem.image);
        setUploadedImageUrl(programItem.image);
      }
    }
  }, [programItem, form]);

  const handleImageUpload = useCallback(async (file: File): Promise<string | null> => {
    console.log(`[ProgramEditor] Starting image upload process for file: ${file.name}`);
    
    try {
      const imageUrl = await uploadProgramImage(file);
      
      if (!imageUrl) {
        console.error("[ProgramEditor] Image upload returned null");
        toast.error("Échec de l'upload de l'image");
        return null;
      }
      
      console.log(`[ProgramEditor] Image upload successful, URL: ${imageUrl}`);
      setUploadedImageUrl(imageUrl);
      return imageUrl;
    } catch (error) {
      console.error("[ProgramEditor] Image upload exception:", error);
      toast.error(`Erreur lors de l'upload: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("[ProgramEditor] No file selected in input");
      return;
    }
    
    console.log(`[ProgramEditor] File selected: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
    setImageFile(file);
    
    const objectUrl = URL.createObjectURL(file);
    console.log(`[ProgramEditor] Created object URL for preview: ${objectUrl}`);
    setImagePreview(objectUrl);
    
    setUploadedImageUrl(null);
  }, []);

  const removeImage = useCallback(() => {
    console.log("[ProgramEditor] Removing image");
    
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      console.log("[ProgramEditor] Revoked object URL");
    }
    
    setImageFile(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    form.setValue('image', '');
    
    console.log("[ProgramEditor] Image removed from form");
  }, [imagePreview, form]);

  const onSubmit = async (values: ProgramItemFormValues) => {
    console.log("[ProgramEditor] Form submission started with values:", values);
    setIsSubmitting(true);
    
    try {
      let finalImageUrl = uploadedImageUrl;
      
      if (imageFile && !uploadedImageUrl) {
        console.log("[ProgramEditor] New image file selected, uploading...");
        finalImageUrl = await handleImageUpload(imageFile);
        
        if (!finalImageUrl) {
          throw new Error("Échec de l'upload de l'image");
        }
      } else if (imagePreview && !imageFile && programItem?.image) {
        console.log("[ProgramEditor] Keeping existing image:", programItem.image);
        finalImageUrl = programItem.image;
      } else if (!imagePreview) {
        console.log("[ProgramEditor] No image selected, clearing image field");
        finalImageUrl = null;
      }
      
      const programData = {
        title: values.title,
        description: values.description,
        icon: values.icon,
        image: finalImageUrl,
        updated_at: new Date().toISOString(),
      };
      
      console.log("[ProgramEditor] Saving program data:", programData);
      
      let error;
      
      if (isEditing && id) {
        console.log(`[ProgramEditor] Updating existing program item with ID: ${id}`);
        ({ error } = await supabase
          .from('program_items')
          .update(programData)
          .eq('id', id));
      } else {
        console.log("[ProgramEditor] Creating new program item");
        ({ error } = await supabase
          .from('program_items')
          .insert([{
            ...programData,
            created_at: new Date().toISOString(),
          }]));
      }
      
      if (error) {
        console.error("[ProgramEditor] Database operation error:", error);
        throw error;
      }
      
      console.log("[ProgramEditor] Program item saved successfully");
      toast.success(isEditing ? "Section du programme mise à jour" : "Section du programme créée");
      navigate('/admin/program');
      
    } catch (error: any) {
      console.error("[ProgramEditor] Submit error:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && isLoadingItem) {
    return (
      <AdminLayout title="Chargement...">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const pageTitleText = isEditing ? "Modifier une section du programme" : "Créer une section du programme";

  return (
    <AdminLayout
      breadcrumb={
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/program">Programme</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{isEditing ? 'Modifier' : 'Ajouter'}</BreadcrumbLink>
          </BreadcrumbItem>
        </>
      }
      backLink={
        <Button variant="outline" size="sm" className="mb-6" asChild>
          <Link to="/admin/program">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux sections du programme
          </Link>
        </Button>
      }
      title={pageTitleText}
      description="Gérez les sections du programme politique"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Détails</TabsTrigger>
          {isEditing && (
            <TabsTrigger value="points">Points du programme</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations de la section</CardTitle>
                  <CardDescription>
                    Définissez le titre et la description générale de cette section du programme
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
                          <Input placeholder="Ex: Transition écologique" {...field} />
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
                          <MarkdownEditor
                            value={field.value}
                            onChange={field.onChange}
                            className="min-h-[200px]"
                            contentType="news"
                          />
                        </FormControl>
                        <FormDescription>
                          Décrivez l'orientation générale et l'importance de cette thématique dans votre programme
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image de la section</FormLabel>
                        <div className="space-y-4">
                          {imagePreview && (
                            <div className="w-full h-40 relative rounded-md overflow-hidden border border-getigne-200">
                              <img 
                                src={imagePreview} 
                                alt="Aperçu" 
                                className="w-full h-full object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={removeImage}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('image-upload')?.click()}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              {imagePreview ? "Changer l'image" : "Ajouter une image"}
                            </Button>
                            <input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageChange}
                            />
                            <input 
                              type="hidden" 
                              {...field} 
                              value={uploadedImageUrl || field.value} 
                            />
                          </div>
                          
                          <FormDescription>
                            Ajoutez une image représentative pour cette section du programme (format recommandé: 16:9)
                          </FormDescription>
                          
                          <div className="text-xs text-muted-foreground mt-4 p-2 bg-muted/30 rounded-md">
                            <p><strong>État de l'image:</strong></p>
                            <p>Image sélectionnée: {imageFile ? 'Oui' : 'Non'}</p>
                            <p>Image URL (champ): {field.value || 'Non définie'}</p>
                            <p>URL téléchargée: {uploadedImageUrl || 'Non téléchargée'}</p>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icône</FormLabel>
                        <FormControl>
                          <IconSelect 
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Choisissez une icône représentative pour cette section
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/admin/program')}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? "Mise à jour..." : "Création..."}
                    </>
                  ) : (
                    isEditing ? "Mettre à jour" : "Créer la section"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {isEditing && (
          <TabsContent value="points">
            <Card>
              <CardHeader>
                <CardTitle>Points du programme</CardTitle>
                <CardDescription>
                  Ajoutez et gérez les points spécifiques de cette section du programme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProgramPointsEditor programItemId={id} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </AdminLayout>
  );
}

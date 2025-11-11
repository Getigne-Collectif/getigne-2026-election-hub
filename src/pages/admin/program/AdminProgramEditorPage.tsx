
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
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Link } from 'react-router-dom';
import EditorJSComponent from '@/components/EditorJSComponent';
import { IconSelect } from '@/components/ui/icon-select';
import ProgramPointsEditor from '@/components/admin/program/points/ProgramPointsEditor';
import { uploadProgramImage } from '@/components/admin/program/points/FileUploadService';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
      
      const { data, error } = await supabase
        .from('program_items')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        toast.error("Erreur lors du chargement de la section");
        throw error;
      }
      
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (programItem) {
      form.reset({
        title: programItem.title,
        description: programItem.description,
        icon: programItem.icon || '',
        image: programItem.image || '',
      });
      
      if (programItem.image) {
        setImagePreview(programItem.image);
        setUploadedImageUrl(programItem.image);
      }
    }
  }, [programItem, form]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setImageFile(file);
    
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    
    uploadProgramImage(file).then(url => {
      if (url) {
        setUploadedImageUrl(url);
        form.setValue('image', url);
      }
    });
  }, [form]);

  const removeImage = useCallback(() => {
    if (imagePreview && !imagePreview.startsWith('http')) {
      URL.revokeObjectURL(imagePreview);
    }
    
    setImageFile(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    form.setValue('image', '');
  }, [imagePreview, form]);

  const onSubmit = async (values: ProgramItemFormValues) => {
    setIsSubmitting(true);
    
    try {
      const finalImageUrl = uploadedImageUrl || values.image || null;
      
      const programData = {
        title: values.title,
        description: values.description,
        icon: values.icon,
        image: finalImageUrl,
        updated_at: new Date().toISOString(),
      };
      
      let error;
      
      if (isEditing && id) {
        ({ error } = await supabase
          .from('program_items')
          .update(programData)
          .eq('id', id));
      } else {
        ({ error } = await supabase
          .from('program_items')
          .insert([{
            ...programData,
            created_at: new Date().toISOString(),
          }]));
      }
      
      if (error) throw error;
      
      toast.success(isEditing ? "Section du programme mise à jour" : "Section du programme créée");
      navigate('/admin/program');
      
    } catch (error) {
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
      {isEditing && id ? (
        <ResizablePanelGroup 
          direction="horizontal" 
          className="min-h-[600px] rounded-lg border"
        >
          <ResizablePanel defaultSize={35} minSize={25}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
                <div className="space-y-6">
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
                          <EditorJSComponent
                            value={field.value || ''}
                            onChange={(data) => field.onChange(JSON.stringify(data))}
                            className="min-h-[300px]"
                            placeholder="Décrivez cette section du programme..."
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
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
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
                            {(field.value || uploadedImageUrl) && (
                              <span className="text-xs text-muted-foreground">
                                Image sélectionnée
                              </span>
                            )}
                          </div>
                          
                          <FormDescription>
                            Ajoutez une image représentative pour cette section du programme (format recommandé: 16:9)
                          </FormDescription>
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
                </div>

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
          </ResizablePanel>
          
          <ResizableHandle withHandle className="bg-getigne-100" />
          
          <ResizablePanel defaultSize={65} minSize={45}>
            <div className="p-6 h-full overflow-auto">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Points</CardTitle>
                  <CardDescription>
                    Ajoutez et gérez les points spécifiques de cette section du programme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProgramPointsEditor programItemId={id} />
                </CardContent>
              </Card>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Informations de la section</CardTitle>
            <CardDescription>
              Définissez le titre et la description générale de cette section du programme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <EditorJSComponent
                          value={field.value || ''}
                          onChange={(data) => field.onChange(JSON.stringify(data))}
                          className="min-h-[300px]"
                          placeholder="Décrivez cette section du programme..."
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
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
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
                          {(field.value || uploadedImageUrl) && (
                            <span className="text-xs text-muted-foreground">
                              Image sélectionnée
                            </span>
                          )}
                        </div>
                        
                        <FormDescription>
                          Ajoutez une image représentative pour cette section du programme (format recommandé: 16:9)
                        </FormDescription>
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
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}

import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import MarkdownEditor from '@/components/MarkdownEditor';
import ProgramPointsEditor from '@/components/admin/program/ProgramPointsEditor';
import { IconSelect } from '@/components/ui/icon-select';

// Form schema for program item details
const programItemSchema = z.object({
  title: z.string().min(2, "Le titre doit comporter au moins 2 caractères"),
  description: z.string().min(10, "La description doit comporter au moins 10 caractères"),
  icon: z.string().optional(),
});

type ProgramItemFormValues = z.infer<typeof programItemSchema>;

export default function AdminProgramEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Form setup
  const form = useForm<ProgramItemFormValues>({
    resolver: zodResolver(programItemSchema),
    defaultValues: {
      title: '',
      description: '',
      icon: '',
    },
  });

  // Fetch program item if editing
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

  // Load form data when programItem is available
  useEffect(() => {
    if (programItem) {
      form.reset({
        title: programItem.title,
        description: programItem.description,
        icon: programItem.icon || '',
      });
    }
  }, [programItem, form]);

  // Handle form submission
  const onSubmit = async (values: ProgramItemFormValues) => {
    setIsSubmitting(true);
    
    try {
      const programData = {
        title: values.title,
        description: values.description,
        icon: values.icon,
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
      
      if (error) {
        throw error;
      }
      
      toast.success(isEditing ? "Section du programme mise à jour" : "Section du programme créée");
      navigate('/admin/program');
      
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Loading state
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


import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProgramPointsEditor from '@/components/admin/program/points/ProgramPointsEditor';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import ProgramItemForm, { ProgramItemFormValues } from '@/components/admin/program/ProgramItemForm';

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

export default function AdminProgramEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const getDefaultValues = (): Partial<ProgramItemFormValues> | undefined => {
    if (!programItem) return undefined;
    
    const rawDescription = programItem.description;
    const normalizedDescription =
      typeof rawDescription === 'string'
        ? rawDescription
        : rawDescription
        ? JSON.stringify(rawDescription)
        : '';

    return {
      title: programItem.title,
      description: normalizedDescription,
      icon: programItem.icon || '',
      image: programItem.image || '',
    };
  };

  const onSubmit = async (values: ProgramItemFormValues) => {
    setIsSubmitting(true);
    
    try {
      const programData = {
        title: values.title,
        description: values.description,
        icon: values.icon,
        image: values.image || null,
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
            slug: generateSlug(values.title),
            created_at: new Date().toISOString(),
          }]));
      }
      
      if (error) throw error;
      
      toast.success(isEditing ? "Section du programme mise à jour" : "Section du programme créée");
      navigate('/admin/program');
      
    } catch (error: any) {
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
            <div className="p-6">
              <ProgramItemForm
                defaultValues={getDefaultValues()}
                onSubmit={onSubmit}
                onCancel={() => navigate('/admin/program')}
                isSubmitting={isSubmitting}
                submitLabel={isEditing ? "Mettre à jour" : "Créer la section"}
              />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle className="bg-brand-100" />
          
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
            <ProgramItemForm
              defaultValues={getDefaultValues()}
              onSubmit={onSubmit}
              onCancel={() => navigate('/admin/program')}
              isSubmitting={isSubmitting}
              submitLabel={isEditing ? "Mettre à jour" : "Créer la section"}
            />
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}

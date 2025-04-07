
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { supabase, ProgramGeneral, asTable } from '@/integrations/supabase/client';
import MarkdownEditor from '@/components/MarkdownEditor';

export default function GeneralPresentationEditor() {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPresentationContent = async () => {
      try {
        setIsLoading(true);
        // Use the type assertion helper for the table name
        const { data, error } = await supabase
          .from(asTable<ProgramGeneral>('program_general'))
          .select('*')
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          setContent(data.content || '');
        }
      } catch (error) {
        console.error('Error fetching presentation:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger la présentation générale."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresentationContent();
  }, [toast]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Check if record exists first
      const { data: existingData, error: checkError } = await supabase
        .from(asTable<ProgramGeneral>('program_general'))
        .select('id')
        .limit(1);
        
      if (checkError) throw checkError;
      
      let saveError;
      
      if (existingData && existingData.length > 0) {
        // Update existing record
        const { error } = await supabase
          .from(asTable<ProgramGeneral>('program_general'))
          .update({ 
            content,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData[0].id);
          
        saveError = error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from(asTable<ProgramGeneral>('program_general'))
          .insert({ 
            content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        saveError = error;
      }
      
      if (saveError) throw saveError;
      
      toast({
        title: "Sauvegarde réussie",
        description: "La présentation générale a été mise à jour."
      });
    } catch (error) {
      console.error('Error saving presentation:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder la présentation générale."
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Présentation générale du programme</CardTitle>
          <CardDescription>Chargement en cours...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Présentation générale du programme</CardTitle>
        <CardDescription>
          Rédigez une introduction générale pour présenter les grandes lignes de votre programme politique.
          Ce texte apparaîtra en haut de la page programme, avant les sections thématiques.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="markdown-editor-container">
            <MarkdownEditor
              value={content}
              onChange={setContent}
              contentType="news"
              className="min-h-[400px]"
            />
          </div>
          
          <div className="text-sm text-muted-foreground mt-2">
            <p>
              Conseil : Utilisez cette section pour présenter votre vision politique globale, les valeurs 
              qui guident votre programme, et expliquer comment ce programme a été construit de manière
              participative avec les citoyens.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="gap-2"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

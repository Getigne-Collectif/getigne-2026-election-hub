
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Upload, X, FileDown } from 'lucide-react';
import { supabase, ProgramGeneral } from '@/integrations/supabase/client';
import EditorJSComponent from '@/components/EditorJSComponent';
import type { OutputData } from '@editorjs/editorjs';

export default function GeneralPresentationEditor() {
  const [content, setContent] = useState<OutputData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filePath, setFilePath] = useState<string | null>(null);
  const { toast } = useToast();

  const getEmptyContent = useCallback((): OutputData => ({
    time: Date.now(),
    blocks: [],
    version: '2.28.0'
  }), []);

  const parseContent = useCallback((value: unknown): OutputData => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && Array.isArray((parsed as OutputData).blocks)) {
          return parsed as OutputData;
        }
      } catch {
        if (value.trim().length > 0) {
          return {
            time: Date.now(),
            blocks: [
              {
                type: 'paragraph',
                data: { text: value }
              }
            ],
            version: '2.28.0'
          };
        }
      }
    } else if (value && typeof value === 'object' && Array.isArray((value as OutputData).blocks)) {
      return value as OutputData;
    }

    return getEmptyContent();
  }, [getEmptyContent]);

  const emptyContent = useMemo(() => getEmptyContent(), [getEmptyContent]);

  useEffect(() => {
    const fetchPresentationContent = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer tous les enregistrements et prendre le plus récent
        // Cela permet de gérer les cas où plusieurs enregistrements existent
        const { data, error } = await supabase
          .from('program_general')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setContent(parseContent((data as ProgramGeneral).content));
          setFileUrl((data as any).file || null);
          setFilePath((data as any).file_path || null);
        } else {
          setContent(emptyContent);
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
  }, [toast, parseContent, emptyContent]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const serializedContent = JSON.stringify(content ?? emptyContent);
      
      // Récupérer tous les enregistrements existants pour gérer les doublons
      const { data: allRecords, error: fetchError } = await supabase
        .from('program_general')
        .select('id, updated_at')
        .order('updated_at', { ascending: false });
        
      if (fetchError) throw fetchError;
      
      // Si plusieurs enregistrements existent, supprimer les doublons (garder le plus récent)
      if (allRecords && allRecords.length > 1) {
        const recordsToDelete = allRecords.slice(1); // Garder le premier (le plus récent)
        const idsToDelete = recordsToDelete.map(r => r.id);
        
        const { error: deleteError } = await supabase
          .from('program_general')
          .delete()
          .in('id', idsToDelete);
          
        if (deleteError) {
          console.warn('Erreur lors de la suppression des doublons:', deleteError);
          // On continue quand même la sauvegarde
        }
      }
      
      // Récupérer l'enregistrement unique (ou null s'il n'existe pas)
      const { data: existingRecord, error: checkError } = await supabase
        .from('program_general')
        .select('id')
        .maybeSingle();
        
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existingRecord) {
        // Mettre à jour l'enregistrement existant
        const { error: updateError } = await supabase
          .from('program_general')
          .update({ 
            content: serializedContent,
            file: fileUrl,
            file_path: filePath,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);
          
        if (updateError) throw updateError;
      } else {
        // Créer un nouvel enregistrement
        const { error: insertError } = await supabase
          .from('program_general')
          .insert({ 
            content: serializedContent,
            file: fileUrl,
            file_path: filePath,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
      }
      
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

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `program-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('program_files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'application/pdf',
        });
      if (error) throw error;
      const { data: publicUrl } = supabase.storage.from('program_files').getPublicUrl(data.path);
      setFileUrl(publicUrl.publicUrl);
      setFilePath(data.path);
      toast({ title: 'Fichier téléversé', description: 'Le PDF a été téléversé avec succès.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: err.message || 'Échec du téléversement' });
    } finally {
      setIsUploading(false);
      e.currentTarget.value = '';
    }
  };

  const removeFile = () => {
    setFileUrl(null);
    setFilePath(null);
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
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="editorjs-wrapper">
            <EditorJSComponent
              value={content ?? emptyContent}
              onChange={(data) => setContent(data)}
              placeholder="Commencez à écrire la présentation générale..."
              className="min-h-[400px]"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Fichier PDF du programme</p>
              <p className="text-sm text-muted-foreground">Téléversez la version téléchargeable (PDF).</p>
            </div>
            <div className="flex items-center gap-2">
              <input id="program-pdf" type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
              <Button variant="outline" size="sm" onClick={() => document.getElementById('program-pdf')?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {isUploading ? 'Téléversement...' : 'Téléverser PDF'}
              </Button>
              {fileUrl && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                    <FileDown className="h-4 w-4 mr-2" /> Voir le PDF
                  </a>
                </Button>
              )}
            </div>
          </div>

          {fileUrl && (
            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
              <div className="flex items-center gap-2 text-sm">
                <FileDown className="h-4 w-4" />
                <span className="truncate max-w-[420px]">{fileUrl}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={removeFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
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

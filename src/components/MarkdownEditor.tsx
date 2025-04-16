import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  contentType?: 'news' | 'event';
  disableImageUpload?: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ 
  value, 
  onChange,
  className = '',
  contentType = 'news',
  disableImageUpload = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>('write');

  // Déterminer le bucket et le chemin en fonction du type de contenu
  const getBucketConfig = () => {
    if (contentType === 'event') {
      return {
        bucket: 'event_images',
        path: 'content',
        bucketName: 'event_images'
      };
    }
    return {
      bucket: 'news_images',
      path: 'news_content',
      bucketName: 'news_images'
    };
  };

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;

        try {
          setIsUploading(true);
          
          const { bucket, path, bucketName } = getBucketConfig();
          
          // Générer un nom unique pour le fichier
          const fileExt = file.name?.split('.').pop() || 'png';
          const fileName = `${uuidv4()}.${fileExt}`;
          const filePath = `${path}/${fileName}`;

          // Uploader l'image vers Supabase Storage
          const { error: uploadError, data } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

          if (uploadError) {
            console.error('Erreur d\'upload:', uploadError);
            throw new Error(`Erreur d'upload: ${uploadError.message}`);
          }

          // Récupérer l'URL publique
          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

          // Insérer l'image dans l'éditeur markdown
          if (textareaRef.current) {
            const textarea = textareaRef.current;
            const startPos = textarea.selectionStart;
            const endPos = textarea.selectionEnd;
            const markdown = `![Image](${publicUrl})`;
            const newValue = 
              value.substring(0, startPos) + 
              markdown + 
              value.substring(endPos);
            
            onChange(newValue);
            
            // Repositionner le curseur après l'image insérée
            setTimeout(() => {
              textarea.focus();
              textarea.selectionStart = textarea.selectionEnd = startPos + markdown.length;
            }, 0);
          }

          toast({
            title: "Image insérée",
            description: "L'image a été téléchargée et insérée dans l'article",
          });
        } catch (error: any) {
          console.error('Erreur lors de l\'upload de l\'image:', error);
          toast({
            title: 'Erreur',
            description: 'Impossible d\'uploader l\'image. ' + error.message,
            variant: 'destructive'
          });
        } finally {
          setIsUploading(false);
        }
        
        break;
      }
    }
  }, [value, onChange, contentType]);

  const handleInsertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const { bucket, path, bucketName } = getBucketConfig();
      
      // Générer un nom unique pour le fichier
      const fileExt = file.name?.split('.').pop() || 'png';
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      // Uploader l'image vers Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erreur d\'upload:', uploadError);
        throw new Error(`Erreur d'upload: ${uploadError.message}`);
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      // Insérer l'image dans l'éditeur markdown
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        const markdown = `![Image](${publicUrl})`;
        const newValue = 
          value.substring(0, startPos) + 
          markdown + 
          value.substring(endPos);
        
        onChange(newValue);
        
        // Repositionner le curseur après l'image insérée
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = startPos + markdown.length;
        }, 0);
      }

      toast({
        title: "Image insérée",
        description: "L'image a été téléchargée et insérée dans l'article",
      });

      // Réinitialiser l'input file
      e.target.value = '';
    } catch (error: any) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'uploader l\'image. ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Repositionner le curseur
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className={`relative border rounded-md ${className}`}>
      {isUploading && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50 rounded-md">
          <div className="bg-white p-4 rounded-md shadow-lg">
            <p>Upload d'image en cours...</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="write" value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <TabsList>
            <TabsTrigger value="write">Écrire</TabsTrigger>
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
          </TabsList>
          
          {!disableImageUpload && (
            <div className="flex items-center">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                className="hidden"
                onChange={handleInsertImage}
              />
              <label 
                htmlFor="image-upload"
                className="flex items-center px-3 py-1 text-sm bg-getigne-50 text-getigne-800 rounded hover:bg-getigne-100 cursor-pointer"
              >
                Insérer une image
              </label>
            </div>
          )}
        </div>
        
        <TabsContent value="write" className="p-0 m-0">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={disableImageUpload ? undefined : handlePaste}
            onKeyDown={handleKeyDown}
            placeholder="Rédigez votre contenu en Markdown... (Vous pouvez aussi coller des images directement)"
            className="min-h-[400px] resize-y rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-4 font-mono"
          />
        </TabsContent>
        
        <TabsContent value="preview" className="p-4 prose max-w-none min-h-[400px] rich-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {value}
          </ReactMarkdown>
        </TabsContent>
      </Tabs>

      {!disableImageUpload && (
        <div className="border-t p-2 text-xs text-muted-foreground">
          Astuce: Vous pouvez coller des images directement dans l'éditeur.
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;

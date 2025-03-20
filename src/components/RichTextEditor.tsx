
import React, { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  placeholder?: string; // Added placeholder prop
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange,
  height = 500,
  placeholder
}) => {
  const editorRef = useRef<any>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  // Fonction pour uploader une image vers Supabase
  const handleImageUpload = async (blobInfo: any, progress: Function): Promise<string> => {
    try {
      setIsUploading(true);
      const file = blobInfo.blob();
      const fileExt = file.name?.split('.').pop() || 'png';
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `news_content/${fileName}`;

      // Upload de l'image vers Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('news_images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Récupération de l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('news_images')
        .getPublicUrl(filePath);

      setIsUploading(false);
      return publicUrl;
    } catch (error: any) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'uploader l\'image. ' + error.message,
        variant: 'destructive'
      });
      setIsUploading(false);
      throw error;
    }
  };

  return (
    <div className="relative">
      {isUploading && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50 rounded-md">
          <div className="bg-white p-4 rounded-md shadow-lg">
            <p>Upload d'image en cours...</p>
          </div>
        </div>
      )}
      <Editor
        apiKey="no-api-key" // Utilisez votre clé API TinyMCE en production
        onInit={(evt, editor) => editorRef.current = editor}
        value={value}
        onEditorChange={onChange}
        init={{
          height,
          menubar: true,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | formatselect | ' +
            'bold italic backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | image | help',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          images_upload_handler: handleImageUpload,
          language: 'fr_FR',
          directionality: 'ltr',
          browser_spellcheck: true,
          automatic_uploads: true,
          entity_encoding: 'raw',
          paste_data_images: true,
          image_advtab: true,
          image_caption: true,
          image_title: true,
          image_dimensions: true,
          placeholder: placeholder, // Use the placeholder if provided
        }}
      />
    </div>
  );
};

export default RichTextEditor;

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import EditorJSComponent from '@/components/EditorJSComponent';
import { IconSelect } from '@/components/ui/icon-select';
import { uploadProgramImage } from '@/components/admin/program/points/FileUploadService';

export const programItemSchema = z.object({
  title: z.string().min(2, "Le titre doit comporter au moins 2 caractères"),
  description: z.string().min(10, "La description doit comporter au moins 10 caractères"),
  icon: z.string().optional(),
  image: z.string().optional(),
});

export type ProgramItemFormValues = z.infer<typeof programItemSchema>;

interface ProgramItemFormProps {
  defaultValues?: Partial<ProgramItemFormValues>;
  onSubmit: (values: ProgramItemFormValues) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  showCancelButton?: boolean;
}

export default function ProgramItemForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Enregistrer",
  cancelLabel = "Annuler",
  showCancelButton = true,
}: ProgramItemFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [editorInstanceKey, setEditorInstanceKey] = useState(0);

  const form = useForm<ProgramItemFormValues>({
    resolver: zodResolver(programItemSchema),
    defaultValues: {
      title: '',
      description: '',
      icon: '',
      image: '',
      ...defaultValues,
    },
  });

  // Initialiser les valeurs et l'aperçu de l'image
  useEffect(() => {
    if (defaultValues) {
      const rawDescription = defaultValues.description;
      const normalizedDescription =
        typeof rawDescription === 'string'
          ? rawDescription
          : rawDescription
          ? JSON.stringify(rawDescription)
          : '';

      form.reset({
        title: defaultValues.title || '',
        description: normalizedDescription,
        icon: defaultValues.icon || '',
        image: defaultValues.image || '',
      });
      setEditorInstanceKey((prev) => prev + 1);
      
      if (defaultValues.image) {
        setImagePreview(defaultValues.image);
        setUploadedImageUrl(defaultValues.image);
      }
    }
  }, [defaultValues, form]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    e.preventDefault();
    e.stopPropagation();
    
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
    
    setImagePreview(null);
    setUploadedImageUrl(null);
    form.setValue('image', '');
  }, [imagePreview, form]);

  const handleSubmit = async (values: ProgramItemFormValues) => {
    const finalImageUrl = uploadedImageUrl || values.image || null;
    
    await onSubmit({
      ...values,
      image: finalImageUrl || undefined,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                  key={`editor-${editorInstanceKey}`}
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
                  <div className="w-full h-40 relative rounded-md overflow-hidden border border-brand-200">
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
          {showCancelButton && onCancel && (
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enregistrement..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}


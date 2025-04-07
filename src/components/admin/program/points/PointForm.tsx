
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import MarkdownEditor from '@/components/MarkdownEditor';
import { ProgramPoint } from '@/types/program.types';

// Form schema for program point
const programPointSchema = z.object({
  title: z.string().min(2, "Le titre doit comporter au moins 2 caractères"),
  content: z.string().min(10, "Le contenu doit comporter au moins 10 caractères"),
});

export type ProgramPointFormValues = z.infer<typeof programPointSchema>;

interface PointFormProps {
  defaultValues?: ProgramPointFormValues;
  onSubmit: (values: ProgramPointFormValues, files: File[]) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
  submitLabel: string;
}

export default function PointForm({ 
  defaultValues = { title: '', content: '' },
  onSubmit, 
  isSubmitting, 
  onCancel,
  submitLabel
}: PointFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<ProgramPointFormValues>({
    resolver: zodResolver(programPointSchema),
    defaultValues,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const fileList = Array.from(event.target.files);
      setSelectedFiles(fileList);
    }
  };

  const handleFormSubmit = async (values: ProgramPointFormValues) => {
    await onSubmit(values, selectedFiles);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  {...field}
                  className="prose max-w-none prose-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenu</FormLabel>
              <FormControl>
                <MarkdownEditor
                  value={field.value}
                  onChange={field.onChange}
                  className="min-h-[200px]"
                  contentType="news"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormItem>
          <FormLabel>Fichiers</FormLabel>
          <FormControl>
            <Input
              type="file"
              multiple
              onChange={handleFileChange}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              className="prose max-w-none prose-sm"
            />
          </FormControl>
          <div className="text-sm text-muted-foreground mt-1">
            {selectedFiles.length > 0 && (
              <p>{selectedFiles.length} fichier(s) sélectionné(s)</p>
            )}
          </div>
        </FormItem>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
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
                Traitement en cours...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

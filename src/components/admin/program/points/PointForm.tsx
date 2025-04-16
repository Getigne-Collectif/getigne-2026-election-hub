
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { ProgramPoint } from "@/types/program.types";
import { uploadFiles } from "./FileUploadService";
import { Loader2, Paperclip, Upload, X } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  content: z.string().min(1, "Le contenu est requis"),
  files: z.array(z.string()).optional(),
});

export type ProgramPointFormValues = z.infer<typeof formSchema>;

interface PointFormProps {
  onSubmit: (values: ProgramPointFormValues, files: File[]) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  defaultValues?: {
    title: string;
    content: string;
  };
  submitLabel?: string;
}

export default function PointForm({ 
  onSubmit, 
  isSubmitting, 
  onCancel,
  defaultValues = { title: '', content: '' },
  submitLabel = "Ajouter" 
}: PointFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const form = useForm<ProgramPointFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues.title,
      content: defaultValues.content,
      files: [],
    },
  });

  const handleSubmit = (values: ProgramPointFormValues) => {
    onSubmit(values, selectedFiles);
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre du point</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Créer un jardin partagé" {...field} />
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
                <Textarea
                  placeholder="Décrivez ce point du programme..."
                  className="h-32"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Détaillez cette proposition et ses objectifs
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File upload section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <FormLabel>Fichiers attachés</FormLabel>
            <FormDescription>
              Vous pouvez joindre des fichiers complémentaires à cette proposition (PDF, images, etc.)
            </FormDescription>
          </div>

          {/* Selected files waiting to be uploaded */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Fichiers à téléverser</p>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-muted/30 border border-border rounded-md p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[300px]">
                        {file.name}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSelectedFile(index)}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="h-4 w-4" />
              Ajouter des fichiers
            </Button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              multiple
              onChange={handleFilesSelected}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

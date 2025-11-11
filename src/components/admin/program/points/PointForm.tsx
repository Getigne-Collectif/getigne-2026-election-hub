
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
import { useEffect, useState, useId } from "react";
import { ProgramPointFileMeta } from "@/types/program.types";
import { PendingFileUpload } from "./FileUploadService";
import { Loader2, Paperclip, Upload, X } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  content: z.string().min(1, "Le contenu est requis"),
  files: z.array(z.string()).optional(),
});

export type ProgramPointFormValues = z.infer<typeof formSchema>;

export interface ProgramPointFormSubmitPayload {
  newFiles: PendingFileUpload[];
  existingFiles: ProgramPointFileMeta[];
  removedFiles: ProgramPointFileMeta[];
}

interface PointFormProps {
  onSubmit: (values: ProgramPointFormValues, payload: ProgramPointFormSubmitPayload) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  defaultValues?: {
    title: string;
    content: string;
  };
  submitLabel?: string;
  initialFiles?: ProgramPointFileMeta[];
}

export default function PointForm({ 
  onSubmit, 
  isSubmitting, 
  onCancel,
  defaultValues = { title: '', content: '' },
  submitLabel = "Ajouter",
  initialFiles = [],
}: PointFormProps) {
  const fileInputId = useId();
  const [selectedFiles, setSelectedFiles] = useState<PendingFileUpload[]>([]);
  const [existingFiles, setExistingFiles] = useState<ProgramPointFileMeta[]>(
    initialFiles.map((file) => ({ ...file }))
  );
  const [removedFiles, setRemovedFiles] = useState<ProgramPointFileMeta[]>([]);
  
  const form = useForm<ProgramPointFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues.title,
      content: defaultValues.content,
      files: [],
    },
  });

  useEffect(() => {
    setExistingFiles(initialFiles.map((file) => ({ ...file })));
    setRemovedFiles([]);
  }, [initialFiles]);

  const handleSubmit = (values: ProgramPointFormValues) => {
    onSubmit(values, {
      newFiles: selectedFiles,
      existingFiles,
      removedFiles,
    });
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const nextFiles: PendingFileUpload[] = Array.from(files).map((file) => ({
        file,
        label: file.name.replace(/\.[^/.]+$/, '') || file.name,
      }));
      setSelectedFiles(prev => [...prev, ...nextFiles]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateSelectedFileLabel = (index: number, label: string) => {
    setSelectedFiles(prev =>
      prev.map((item, i) => (i === index ? { ...item, label } : item))
    );
  };

  const updateExistingFileLabel = (index: number, label: string) => {
    setExistingFiles(prev =>
      prev.map((item, i) => (i === index ? { ...item, label } : item))
    );
  };

  const removeExistingFile = (index: number) => {
    setExistingFiles(prev => {
      const file = prev[index];
      if (file) {
        setRemovedFiles(current => {
          if (current.find(existing => existing.url === file.url)) {
            return current;
          }
          return [...current, file];
        });
      }
      return prev.filter((_, i) => i !== index);
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

        {/* Existing files */}
        {existingFiles.length > 0 && (
          <div className="space-y-2">
            <FormLabel>Fichiers existants</FormLabel>
            <div className="space-y-2">
              {existingFiles.map((file, index) => (
                <div
                  key={file.url}
                  className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Paperclip className="h-4 w-4" />
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate max-w-[220px] text-getigne-accent hover:underline"
                      >
                        {file.url.split('/').pop()}
                      </a>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        asChild
                      >
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          Télécharger
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExistingFile(index)}
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <Input
                    value={file.label}
                    onChange={(event) => updateExistingFileLabel(index, event.target.value)}
                    placeholder="Libellé du fichier"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

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
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[240px]">
                          {file.file.name}
                        </span>
                      </div>
                      <Input
                        value={file.label}
                        onChange={(event) => updateSelectedFileLabel(index, event.target.value)}
                        placeholder="Libellé affiché pour ce fichier"
                      />
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
              onClick={() => document.getElementById(fileInputId)?.click()}
            >
              <Upload className="h-4 w-4" />
              Ajouter des fichiers
            </Button>
            <input
              id={fileInputId}
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

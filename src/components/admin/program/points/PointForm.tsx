
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
import { useEffect, useState, useId } from "react";
import { ProgramPointFileMeta } from "@/types/program.types";
import { PendingFileUpload } from "./FileUploadService";
import { Loader2, Paperclip, Upload, X } from "lucide-react";
import EditorJSComponent from "@/components/EditorJSComponent";
import type { OutputData } from '@editorjs/editorjs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProgramCompetentEntity } from "@/types/program.types";

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  content: z.any().refine(
    (val) => {
      if (typeof val === 'string') return val.length > 0;
      if (typeof val === 'object' && val !== null) {
        return val.blocks && Array.isArray(val.blocks) && val.blocks.length > 0;
      }
      return false;
    },
    { message: "Le contenu est requis" }
  ),
  files: z.array(z.string()).optional(),
  competent_entity_id: z.string().uuid().optional().nullable(),
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
    content: OutputData | string;
    competent_entity_id?: string | null;
  };
  submitLabel?: string;
  initialFiles?: ProgramPointFileMeta[];
  competentEntities: ProgramCompetentEntity[];
  isLoadingCompetentEntities?: boolean;
  additionalRightColumn?: React.ReactNode;
}

export default function PointForm({ 
  onSubmit, 
  isSubmitting, 
  onCancel,
  defaultValues = { title: '', content: { time: Date.now(), blocks: [], version: '2.28.0' } },
  submitLabel = "Ajouter",
  initialFiles = [],
  competentEntities,
  isLoadingCompetentEntities = false,
  additionalRightColumn,
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
      competent_entity_id: defaultValues.competent_entity_id ?? null,
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale (gauche) - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
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
                    <EditorJSComponent
                      value={field.value ?? { time: Date.now(), blocks: [], version: '2.28.0' }}
                      onChange={field.onChange}
                      placeholder="Détaillez cette proposition et ses objectifs..."
                      className="max-h-[60vh] overflow-y-auto"
                    />
                  </FormControl>
                  <FormDescription>
                    Détaillez cette proposition et ses objectifs
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Colonne secondaire (droite) - 1/3 */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="competent_entity_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instance compétente</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                      value={field.value ?? 'none'}
                      disabled={isLoadingCompetentEntities}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une instance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucune (gérée directement)</SelectItem>
                        {competentEntities.map((entity) => (
                          <SelectItem key={entity.id} value={entity.id}>
                            {entity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Instance responsable de la mesure
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
                      className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                          <Paperclip className="h-4 w-4 flex-shrink-0" />
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-getigne-accent hover:underline"
                            title={file.url.split('/').pop()}
                          >
                            {file.url.split('/').pop()}
                          </a>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExistingFile(index)}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                      <Input
                        value={file.label}
                        onChange={(event) => updateExistingFileLabel(index, event.target.value)}
                        placeholder="Libellé"
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File upload section */}
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <FormLabel>Fichiers attachés</FormLabel>
                <FormDescription className="text-xs">
                  PDF, images, etc.
                </FormDescription>
              </div>

              {/* Selected files waiting to be uploaded */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">À téléverser</p>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 bg-muted/30 border border-border rounded-md p-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs truncate" title={file.file.name}>
                              {file.file.name}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSelectedFile(index)}
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                        <Input
                          value={file.label}
                          onChange={(event) => updateSelectedFileLabel(index, event.target.value)}
                          placeholder="Libellé"
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 w-full"
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

            {/* Contenu additionnel pour la colonne de droite */}
            {additionalRightColumn}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
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

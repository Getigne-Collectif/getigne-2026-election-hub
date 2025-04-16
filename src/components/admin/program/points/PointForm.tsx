
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
import { FileUploadService } from "./FileUploadService";
import { Loader2, Paperclip, Trash2, Upload, X } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  content: z.string().min(1, "Le contenu est requis"),
  files: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PointFormProps {
  onSubmit: (data: FormValues) => void;
  isSubmitting: boolean;
  point?: ProgramPoint | null;
  programItemId: string;
}

export default function PointForm({ onSubmit, isSubmitting, point, programItemId }: PointFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: point?.title || "",
      content: point?.content || "",
      files: point?.files || [],
    },
  });

  // Load point data when editing
  useEffect(() => {
    if (point) {
      form.reset({
        title: point.title,
        content: point.content,
        files: point.files || [],
      });
      if (point.files && Array.isArray(point.files)) {
        setUploadedFiles(point.files);
      }
    }
  }, [point, form]);

  const handleSubmit = async (values: FormValues) => {
    try {
      if (selectedFiles.length > 0) {
        setUploading(true);
        const fileService = new FileUploadService();
        const newUploadedFiles = await fileService.uploadFiles(selectedFiles, programItemId);
        setUploading(false);
        
        values.files = [...uploadedFiles, ...newUploadedFiles];
      } else {
        values.files = uploadedFiles;
      }
      
      onSubmit(values);
    } catch (error) {
      console.error("Error uploading files:", error);
      setUploading(false);
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedFile = (fileUrl: string) => {
    setUploadedFiles(prev => prev.filter(f => f !== fileUrl));
    form.setValue("files", form.getValues("files")?.filter(f => f !== fileUrl) || []);
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

          {/* Previously uploaded files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Fichiers existants</p>
              <div className="space-y-2">
                {uploadedFiles.map((fileUrl, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-muted/30 border border-border rounded-md p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[300px]">
                        {fileUrl.split("/").pop()}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUploadedFile(fileUrl)}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

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

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || uploading}>
            {(isSubmitting || uploading) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {point ? "Mettre à jour" : "Ajouter"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

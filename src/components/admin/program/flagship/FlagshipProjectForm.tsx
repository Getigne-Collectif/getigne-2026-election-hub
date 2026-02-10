import { useState, useCallback, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import EditorJSComponent from '@/components/EditorJSComponent';
import { IconSelect } from '@/components/ui/icon-select';
import { Upload, X, GripVertical, Plus, Trash2, FileDown } from 'lucide-react';
import {
  uploadFlagshipProjectImage,
  uploadFlagshipProjectFile,
  removeFilesFromStorage,
} from '@/components/admin/program/points/FileUploadService';
import type { ProgramFlagshipProject, FlagshipProjectEffect, FlagshipProjectTimelineEvent } from '@/types/program.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const effectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Le nom est requis'),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale invalide'),
});

const timelineEventSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Le nom est requis'),
  icon: z.string().optional(),
  date_text: z.string().min(1, 'La date est requise'),
});

const schema = z.object({
  title: z.string().min(3, 'Le titre doit comporter au moins 3 caractères'),
  description: z.string().min(10, 'La description doit comporter au moins 10 caractères'),
  imageUrl: z.string().optional().or(z.literal('')),
  effects: z.array(effectSchema).optional(),
  timeline: z.array(timelineEventSchema).optional(),
  timelineHorizon: z.string().min(1, 'Sélectionnez un horizon'),
  fileUrl: z.string().optional().or(z.literal('')),
  fileLabel: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface FlagshipProjectFormProps {
  project: ProgramFlagshipProject | null;
  mode: 'create' | 'edit';
  onSubmit: (data: Partial<ProgramFlagshipProject>) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function FlagshipProjectForm({
  project,
  mode,
  onSubmit,
  onCancel,
  isSubmitting,
}: FlagshipProjectFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
      effects: [],
      timeline: [],
      timelineHorizon: 'Début de mandat',
      fileUrl: '',
      fileLabel: '',
    },
  });

  const {
    fields: effectFields,
    append: appendEffect,
    remove: removeEffect,
    move: moveEffect,
  } = useFieldArray({
    control: form.control,
    name: 'effects',
  });

  const {
    fields: timelineFields,
    append: appendTimeline,
    remove: removeTimeline,
    move: moveTimeline,
  } = useFieldArray({
    control: form.control,
    name: 'timeline',
  });

  useEffect(() => {
    if (project && mode === 'edit') {
      const rawDescription =
        project.description && typeof project.description === 'object'
          ? JSON.stringify(project.description)
          : (project.description as string | null) ?? '';

      form.reset({
        title: project.title,
        description: rawDescription,
        imageUrl: project.image_url ?? '',
        effects: (project.effects ?? []) as FlagshipProjectEffect[],
        timeline: (project.timeline ?? []) as FlagshipProjectTimelineEvent[],
        timelineHorizon: project.timeline_horizon ?? 'Début de mandat',
        fileUrl: project.file_url ?? '',
        fileLabel: project.file_label ?? '',
      });
      
      setImagePreview(project.image_url ?? null);
      setImagePath(project.image_path ?? null);
      setFilePreview(project.file_url ?? null);
      setFilePath(project.file_path ?? null);
    }
  }, [project, mode, form]);

  const handleImageChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploadingImage(true);
      try {
        const uploadResult = await uploadFlagshipProjectImage(file);
        if (!uploadResult) {
          return;
        }

        const { url, path } = uploadResult;
        setImagePreview(url);
        setImagePath(path);
        form.setValue('imageUrl', url);
        toast.success('Image téléchargée avec succès');
      } catch (error) {
        toast.error("Erreur lors du téléchargement de l'image");
      } finally {
        setIsUploadingImage(false);
      }
    },
    [form],
  );

  const removeImage = useCallback(async () => {
    if (imagePath) {
      await removeFilesFromStorage([imagePath]);
    }
    setImagePreview(null);
    setImagePath(null);
    form.setValue('imageUrl', '');
  }, [imagePath, form]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploadingFile(true);
      try {
        const uploadResult = await uploadFlagshipProjectFile(file);
        if (!uploadResult) {
          return;
        }

        const { url, path } = uploadResult;
        setFilePreview(url);
        setFilePath(path);
        form.setValue('fileUrl', url);
        if (!form.getValues('fileLabel')) {
          form.setValue('fileLabel', file.name);
        }
        toast.success('Fichier téléchargé avec succès');
      } catch (error) {
        toast.error('Erreur lors du téléchargement du fichier');
      } finally {
        setIsUploadingFile(false);
      }
    },
    [form],
  );

  const removeFile = useCallback(async () => {
    if (filePath) {
      await removeFilesFromStorage([filePath]);
    }
    setFilePreview(null);
    setFilePath(null);
    form.setValue('fileUrl', '');
    form.setValue('fileLabel', '');
  }, [filePath, form]);

  const handleAddEffect = useCallback(() => {
    appendEffect({
      id: uuidv4(),
      name: '',
      icon: '',
      color: '#10b981',
    });
  }, [appendEffect]);

  const handleAddTimelineEvent = useCallback(() => {
    appendTimeline({
      id: uuidv4(),
      name: '',
      icon: '',
      date_text: '',
    });
  }, [appendTimeline]);

  const handleEffectsDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      moveEffect(result.source.index, result.destination.index);
    },
    [moveEffect],
  );

  const handleTimelineDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      moveTimeline(result.source.index, result.destination.index);
    },
    [moveTimeline],
  );

  const handleFormSubmit = async (values: FormValues) => {
    const payload: Partial<ProgramFlagshipProject> = {
      title: values.title,
      description: values.description,
      image_url: imagePreview ?? (project?.image_url || null),
      image_path: imagePath ?? (project?.image_path || null),
      effects: values.effects as FlagshipProjectEffect[],
      timeline: values.timeline as FlagshipProjectTimelineEvent[],
      timeline_horizon: values.timelineHorizon || project?.timeline_horizon || 'Début de mandat',
      file_url: filePreview ?? (project?.file_url || null),
      file_path: filePath ?? (project?.file_path || null),
      file_label: values.fileLabel || (project?.file_label || null),
    };

    await onSubmit(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="effects">Effets</TabsTrigger>
            <TabsTrigger value="timeline">Chronologie</TabsTrigger>
            <TabsTrigger value="file">Fichier</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre du projet</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Un centre socio-culturel" {...field} />
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
                      key={`editor-${project?.id || 'new'}`}
                      value={field.value || ''}
                      onChange={(data) => field.onChange(JSON.stringify(data))}
                      className="min-h-[300px]"
                      placeholder="Décrivez ce projet phare..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={() => (
                <FormItem>
                  <FormLabel>Image du projet</FormLabel>
                  <div className="space-y-4">
                    {imagePreview && (
                      <div className="relative w-full h-48 rounded-md overflow-hidden border">
                        <img
                          src={imagePreview}
                          alt="Aperçu"
                          className="w-full h-full object-cover"
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

                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploadingImage}
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploadingImage ? 'Téléchargement...' : imagePreview ? "Changer l'image" : 'Ajouter une image'}
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                  <FormDescription>
                    Image en fond du projet (optionnelle, sera affichée avec un overlay)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="effects" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Effets du projet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DragDropContext onDragEnd={handleEffectsDragEnd}>
                  <Droppable droppableId="effects-list">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {effectFields.map((field, index) => (
                          <Draggable key={field.id} draggableId={field.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="flex items-start gap-3 p-4 border rounded-lg bg-white"
                              >
                                <div {...provided.dragHandleProps} className="mt-2 cursor-grab">
                                  <GripVertical className="h-5 w-5 text-gray-400" />
                                </div>

                                <div className="flex-1 space-y-3">
                                  <FormField
                                    control={form.control}
                                    name={`effects.${index}.name`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Nom de l'effet</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Ex: Créer du lien social" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                      control={form.control}
                                      name={`effects.${index}.icon`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Icône (optionnelle)</FormLabel>
                                          <FormControl>
                                            <IconSelect value={field.value} onChange={field.onChange} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name={`effects.${index}.color`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Couleur</FormLabel>
                                          <FormControl>
                                            <div className="flex gap-2">
                                              <Input type="color" {...field} className="w-20 h-10" />
                                              <Input {...field} placeholder="#10b981" className="flex-1" />
                                            </div>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeEffect(index)}
                                  className="mt-2"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                <Button type="button" variant="outline" onClick={handleAddEffect} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un effet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chronologie du projet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="timelineHorizon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horizon global</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Début de mandat, Milieu de mandat, 2026-2027..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Donnez une vision d'ensemble de l'horizon temporel de ce projet (saisie libre).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DragDropContext onDragEnd={handleTimelineDragEnd}>
                  <Droppable droppableId="timeline-list">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {timelineFields.map((field, index) => (
                          <Draggable key={field.id} draggableId={field.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="flex items-start gap-3 p-4 border rounded-lg bg-white"
                              >
                                <div {...provided.dragHandleProps} className="mt-2 cursor-grab">
                                  <GripVertical className="h-5 w-5 text-gray-400" />
                                </div>

                                <div className="flex-1 space-y-3">
                                  <FormField
                                    control={form.control}
                                    name={`timeline.${index}.name`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Nom de l'événement</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Ex: Étude de faisabilité" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                      control={form.control}
                                      name={`timeline.${index}.date_text`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Date</FormLabel>
                                          <FormControl>
                                            <Input placeholder="Ex: Printemps 2026" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name={`timeline.${index}.icon`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Icône (optionnelle)</FormLabel>
                                          <FormControl>
                                            <IconSelect value={field.value} onChange={field.onChange} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeTimeline(index)}
                                  className="mt-2"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                <Button type="button" variant="outline" onClick={handleAddTimelineEvent} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un événement
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="file" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fichier détaillé du projet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filePreview && (
                  <div className="p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileDown className="h-5 w-5 text-brand" />
                      <div>
                        <p className="font-medium">{form.getValues('fileLabel') || 'Fichier téléchargé'}</p>
                        <a
                          href={filePreview}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-brand hover:underline"
                        >
                          Voir le fichier
                        </a>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploadingFile}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploadingFile ? 'Téléchargement...' : filePreview ? 'Changer le fichier' : 'Ajouter un fichier'}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <FormField
                  control={form.control}
                  name="fileLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label du fichier</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Dossier complet du projet" {...field} />
                      </FormControl>
                      <FormDescription>
                        Texte affiché pour le lien de téléchargement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : mode === 'create' ? 'Créer' : 'Mettre à jour'}
          </Button>
        </div>
      </form>
    </Form>
  );
}




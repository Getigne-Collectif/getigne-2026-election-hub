import React, { useState, useEffect, useRef } from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client.ts';
import { useToast } from '@/components/ui/use-toast.ts';
import { Button } from '@/components/ui/button.tsx';
import {Loader2, Save, Eye, ArrowLeft, Home, Upload, ImageIcon} from 'lucide-react';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useAuth } from '@/context/auth';
import MarkdownEditor from "@/components/MarkdownEditor.tsx";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";
import { v4 as uuidv4 } from 'uuid';
import {Helmet, HelmetProvider} from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout.tsx";
import { Switch } from '@/components/ui/switch.tsx';

// Helper function to generate slug
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const AdminEventEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isModerator, user } = useAuth();
  const isEditMode = Boolean(id);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [committeeId, setCommitteeId] = useState('');
  const [status, setStatus] = useState('published');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [isMembersOnly, setIsMembersOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slug, setSlug] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch committees data
  const { data: committees = [] } = useQuery({
    queryKey: ['committees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citizen_committees')
        .select('id, title');

      if (error) throw error;
      return data;
    },
  });

  // Fetch event data if in edit mode
  const { data: event, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Événement non trouvé",
          description: "L'événement que vous essayez de modifier n'existe pas",
          variant: "destructive"
        });
        navigate('/admin/events');
        return null;
      }

      return data;
    },
    enabled: isEditMode,
  });

  // Update form fields when event data is loaded
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDate(event.date ? new Date(event.date).toISOString().slice(0, 16) : '');
      setLocation(event.location || '');
      setDescription(event.description || '');
      setContent(event.content || '');
      setImage(event.image || '');
      setCommitteeId(event.committee_id || '');
      setStatus(event.status || 'published');
      setAllowRegistration(event.allow_registration !== false);
      setIsMembersOnly(event.is_members_only === true);
      setSlug(event.slug || '');
    }
  }, [event]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedImage(e.target.files[0]);
      // Afficher un aperçu local
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!uploadedImage) return image;

    try {
      const fileExt = uploadedImage.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `event-images/${fileName}`;

      const { error } = await supabase.storage
        .from('public')
        .upload(filePath, uploadedImage);

      if (error) throw error;

      const { data } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      return data.publicUrl;

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erreur d'upload",
        description: error.message || "Une erreur est survenue lors de l'upload de l'image",
        variant: "destructive"
      });
      return image;
    }
  };

  const handleSubmit = async (e: React.FormEvent, saveStatus: 'draft' | 'published' | 'archived' = 'published') => {
    e.preventDefault();

    if (!title || !date || !location || !description) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Générer le slug si nécessaire
      const eventSlug = slug || generateSlug(title);

      // Upload de l'image si une nouvelle a été sélectionnée
      let imageUrl = image;
      if (uploadedImage) {
        imageUrl = await uploadImage();
      }

      // Si nous n'avons pas d'URL d'image à ce stade, afficher une erreur
      if (!imageUrl) {
        toast({
          title: "Image manquante",
          description: "Veuillez télécharger une image pour l'événement",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const eventData = {
        title,
        date,
        location,
        description,
        content,
        image: imageUrl,
        committee_id: committeeId || null,
        committee: committeeId ? committees.find(c => c.id === committeeId)?.title : null,
        allow_registration: allowRegistration,
        is_members_only: isMembersOnly,
        status: saveStatus,
        slug: eventSlug
      };

      let result;

      if (isEditMode && id) {
        // Mise à jour d'un événement existant
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', id);

        if (error) throw error;

        result = { id, ...eventData };

        toast({
          title: "Événement mis à jour",
          description: "L'événement a été mis à jour avec succès",
        });
      } else {
        // Création d'un nouvel événement
        const { data, error } = await supabase
          .from('events')
          .insert(eventData)
          .select();

        if (error) throw error;

        if (!data || data.length === 0) {
          throw new Error("Erreur lors de la création de l'événement");
        }

        result = data[0];

        toast({
          title: "Événement créé",
          description: "L'événement a été créé avec succès",
        });
      }

      // Redirection vers la liste des événements
      navigate('/admin/events');
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'enregistrement de l'événement",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (!isAdmin && !isModerator) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold">Accès refusé</h1>
            <p className="mt-4">Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</p>
            <Button onClick={() => navigate('/')} className="mt-6">
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }
  const breadcrumb = <>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <Link to="/admin/events">
        <BreadcrumbPage>Agenda</BreadcrumbPage>
      </Link>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>{isEditMode ? "Modifier l'événement" : "Nouvel événement"}</BreadcrumbPage>
    </BreadcrumbItem>
  </>

  return (
      <HelmetProvider>
        <Helmet>
          <title>{isEditMode ? "Modifier l'article" : "Créer un article"} | Admin | Gétigné Collectif</title>
        </Helmet>

        <AdminLayout breadcrumb={breadcrumb} backLink={<div className="flex items-center gap-4 my-4">
          <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/events')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">{isEditMode ? "Modifier l'événement" : "Créer un événement"}</h1>
        </div>}>

          <div className="flex-grow container mx-auto px-4 py-8">
            {isLoadingEvent ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Colonne de gauche avec titre, date/lieu, et contenu */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Titre *</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => {
                            setTitle(e.target.value);
                            if (!isEditMode || !slug) {
                              setSlug(generateSlug(e.target.value));
                            }
                          }}
                          placeholder="Titre de l'événement"
                          required
                        />
                      </div>

                      <div className="flex gap-4">
                        <div className="w-1/2">
                          <div>
                            <Label htmlFor="description">Description courte *</Label>
                            <Textarea
                              id="description"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Courte description de l'événement"
                              rows={3}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="date">Date et heure *</Label>
                            <Input
                              id="date"
                              type="datetime-local"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="location">Lieu *</Label>
                            <Input
                              id="location"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder="Lieu de l'événement"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="committee">Commission</Label>
                            <select
                              id="committee"
                              value={committeeId}
                              onChange={(e) => setCommitteeId(e.target.value)}
                              className="w-full border border-gray-300 rounded-md p-2"
                            >
                              <option value="">-- Aucune commission --</option>
                              {committees.map((committee) => (
                                <option key={committee.id} value={committee.id}>
                                  {committee.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="w-1/2">
                          <Label>Image principale *</Label>
                          <div className="mt-2 border rounded-md p-4 space-y-4">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleImageChange}
                              accept="image/*"
                              className="hidden"
                            />

                            {image ? (
                              <div className="space-y-3">
                                <div className="relative w-full h-48 rounded-md overflow-hidden">
                                  <img
                                    src={image}
                                    alt="Aperçu"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={triggerFileInput}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Remplacer l'image
                                </Button>
                              </div>
                              ) : (
                              <div className="flex flex-col items-center justify-center h-48 bg-gray-50 border border-dashed border-gray-300 rounded-md cursor-pointer" onClick={triggerFileInput}>
                                <ImageIcon className="h-10 w-10 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-500">Cliquez pour ajouter une image</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Contenu détaillé</Label>
                        <div className="mt-2 border rounded-md">
                          <MarkdownEditor
                            value={content}
                            onChange={setContent}
                            contentType="event"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Colonne de droite avec les boutons, statut, slug, image, etc. */}
                    <div className="flex flex-wrap gap-3 justify-end">
                      {isEditMode && slug && (
                        <Button
                          type="button"
                          variant="outline"
                          size='sm'
                          onClick={() => window.open(`/agenda/${slug}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                          Prévisualiser
                        </Button>
                      )}
                      <Button
                        type="submit"
                          size='sm'
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Publier
                      </Button>
                    </div>

                    <div className="bg-getigne-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-4">État de publication</h3>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
                        className="w-full border border-gray-300 rounded-md p-2"
                      >
                        <option value="published">Publié</option>
                        <option value="draft">Brouillon</option>
                        <option value="archived">Archivé</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="slug-evenement"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Identifiant URL de l'événement (généré automatiquement si laissé vide)
                      </p>
                    </div>

                    <div className="bg-getigne-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-4">Paramètres d'inscription</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="allow-registration" className="font-medium">Autoriser les inscriptions</Label>
                            <p className="text-sm text-getigne-500">Activez pour permettre aux utilisateurs de s'inscrire à cet événement</p>
                          </div>
                          <Switch 
                            id="allow-registration" 
                            checked={allowRegistration} 
                            onCheckedChange={setAllowRegistration} 
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="members-only" className="font-medium">Réservé aux adhérents</Label>
                            <p className="text-sm text-getigne-500">Activez pour limiter les inscriptions aux adhérents uniquement</p>
                          </div>
                          <Switch 
                            id="members-only" 
                            checked={isMembersOnly} 
                            onCheckedChange={setIsMembersOnly} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </AdminLayout>
      </HelmetProvider>
  );
};

export default AdminEventEditorPage;

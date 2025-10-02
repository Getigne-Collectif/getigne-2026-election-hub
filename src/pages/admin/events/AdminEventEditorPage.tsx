
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams} from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client.ts';
import { useToast } from '@/components/ui/use-toast.ts';
import { Button } from '@/components/ui/button.tsx';
import {Loader2, Save, Eye, ArrowLeft, Home, Upload, ImageIcon, Coffee, MapPin, Package, UserCheck, User, Phone, Mail, Calendar} from 'lucide-react';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useAuth } from '@/context/auth';
import MarkdownEditor from "@/components/MarkdownEditor.tsx";
import { v4 as uuidv4 } from 'uuid';
import {Helmet, HelmetProvider} from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout.tsx";
import { Switch } from '@/components/ui/switch.tsx';
import { sendDiscordNotification, DiscordColors, createDiscordEvent } from '@/utils/notifications.ts';

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isModerator, user } = useAuth();
  const isEditMode = Boolean(id);
  const initialEventType = searchParams.get('type') || 'regular';
  const [eventType, setEventType] = useState<'regular' | 'neighborhood'>(initialEventType as 'regular' | 'neighborhood');

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
  
  // Champs spécifiques aux événements de voisinage
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerContact, setOrganizerContact] = useState('');
  const [kitProvided, setKitProvided] = useState(true);
  const [memberPresent, setMemberPresent] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Réinitialiser les champs spécifiques lors du changement de type d'événement
  const handleEventTypeChange = (newType: 'regular' | 'neighborhood') => {
    setEventType(newType);
    
    // Si on passe à "regular", on réinitialise les champs de voisinage
    if (newType === 'regular') {
      setLatitude('');
      setLongitude('');
      setOrganizerName('');
      setOrganizerContact('');
      setKitProvided(true);
      setMemberPresent(true);
    }
    
    // Si on passe à "neighborhood", on peut désactiver l'inscription par défaut
    if (newType === 'neighborhood') {
      setAllowRegistration(false);
      setIsMembersOnly(false);
    }
  };
  
  const [createDiscordScheduledEvent, setCreateDiscordScheduledEvent] = useState(true);
  const [estimatedDuration, setEstimatedDuration] = useState(2);

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

  // Fonction pour convertir une date avec fuseau horaire en format datetime-local
  const formatDateForInput = (dateStr: string): string => {
    if (!dateStr) return '';
    
    // Si la date contient un fuseau horaire, on l'extrait directement
    // Format attendu: "2025-09-18T20:00:00+02:00" ou "2025-09-18 20:00:00+02"
    const match = dateStr.match(/(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2})/);
    if (match) {
      return `${match[1]}T${match[2]}`;
    }
    
    // Fallback: utiliser la méthode traditionnelle si le format est différent
    return new Date(dateStr).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDate(formatDateForInput(event.date || ''));
      setLocation(event.location || '');
      setDescription(event.description || '');
      setContent(event.content || '');
      setImage(event.image || '');
      setCommitteeId(event.committee_id || '');
      setStatus(event.status || 'published');
      setAllowRegistration(event.allow_registration !== false);
      setIsMembersOnly(event.is_members_only === true);
      setSlug(event.slug || '');
      
      // Type d'événement
      setEventType(event.event_type === 'neighborhood' ? 'neighborhood' : 'regular');
      
      // Champs spécifiques aux événements de voisinage
      setLatitude(event.latitude?.toString() || '');
      setLongitude(event.longitude?.toString() || '');
      setOrganizerName(event.organizer_name || '');
      setOrganizerContact(event.organizer_contact || '');
      setKitProvided(event.kit_provided !== false);
      setMemberPresent(event.member_present !== false);
    }
  }, [event]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedImage(e.target.files[0]);
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

  const notifyDiscord = async (eventData: any, isNew: boolean) => {
    try {
      const committeeInfo = committeeId 
        ? committees.find(c => c.id === committeeId)?.title || ''
        : '';
      
      const eventDate = new Date(date);
      const formattedDate = eventDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const formattedTime = eventDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const message = isNew 
        ? `**Nouvel événement créé : ${title}**\n\n` +
          `📅 ${formattedDate} à ${formattedTime}\n` +
          `📍 ${location}\n` +
          (committeeInfo ? `👥 Commission: ${committeeInfo}\n` : '') +
          `\n${description}\n\n` +
          `${isMembersOnly ? '🔒 Réservé aux adhérents' : '🔓 Ouvert à tous'}\n` +
          `${allowRegistration ? '✅ Inscriptions ouvertes' : '❌ Sans inscription'}`
        : `**Événement mis à jour : ${title}**\n\n` +
          `📅 ${formattedDate} à ${formattedTime}\n` +
          `📍 ${location}\n` +
          (committeeInfo ? `👥 Commission: ${committeeInfo}\n` : '') +
          `\n${description}`;
      
      await sendDiscordNotification({
        title: isNew ? "Nouvel événement" : "Événement mis à jour",
        message,
        color: isNew ? DiscordColors.GREEN : DiscordColors.BLUE,
        username: "Calendrier Gétigné Collectif",
        resourceType: "event",
        resourceId: eventData.slug || eventData.id
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification Discord:", error);
    }
  };

  const createDiscordScheduled = async (eventData: any) => {
    if (!createDiscordScheduledEvent) return;
    
    try {
      const eventDate = new Date(date);
      
      const endDate = new Date(eventDate);
      endDate.setHours(endDate.getHours() + estimatedDuration);
      
      const startTime = eventDate.toISOString();
      const endTime = endDate.toISOString();
      
      const committeeInfo = committeeId 
        ? committees.find(c => c.id === committeeId)?.title || ''
        : '';
      
      let imageToSend = image;
      if (uploadedImage) {
        try {
          imageToSend = await uploadImage();
        } catch (error) {
          console.error("Erreur lors de l'upload de l'image:", error);
          imageToSend = undefined; // En cas d'erreur, ne pas envoyer d'image
          
          toast({
            title: "Avertissement",
            description: "L'événement sera créé sans image en raison d'une erreur d'upload",
            variant: "destructive"
          });
        }
      } else if (image && image.startsWith('data:') && image.length > 1024 * 1024) {
        console.warn('Image en base64 trop volumineuse, événement créé sans image');
        imageToSend = undefined;
        
        toast({
          title: "Avertissement",
          description: "L'image est trop volumineuse pour Discord. L'événement sera créé sans image.",
          // Fix type error: "warning" is not a valid variant
          variant: "default"
        });
      }
      
      const currentSlug = eventData.slug || slug;
      
      await createDiscordEvent({
        name: title,
        description: description,
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        location: location,
        image: imageToSend,
        committee: committeeInfo,
        slug: currentSlug
      });
      
      toast({
        title: "Événement Discord créé",
        description: "L'événement a été ajouté au calendrier Discord avec succès",
      });
    } catch (error: any) {
      console.error("Erreur lors de la création de l'événement Discord:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'événement Discord. " + (error.message || ""),
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const eventSlug = slug || generateSlug(title);

      let imageUrl = image;
      if (uploadedImage) {
        imageUrl = await uploadImage();
      }

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
        status,
        slug: eventSlug,
        event_type: eventType,
        // Champs spécifiques aux événements de voisinage
        ...(eventType === 'neighborhood' && {
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          organizer_name: organizerName || null,
          organizer_contact: organizerContact || null,
          kit_provided: kitProvided,
          member_present: memberPresent
        })
      };

      let result;

      if (isEditMode && id) {
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
        
        await notifyDiscord(result, false);
      } else {
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
        
        await notifyDiscord(result, true);
        
        if (createDiscordScheduledEvent) {
          await createDiscordScheduled({...result, slug: eventSlug});
        }
      }

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
  
  return (
      <HelmetProvider>
        <Helmet>
          <title>
            {isEditMode 
              ? `Modifier l'${eventType === 'neighborhood' ? 'événement de voisinage' : 'événement'}`
              : `Créer un ${eventType === 'neighborhood' ? 'Café de quartier' : 'événement'}`
            } | Admin | Gétigné Collectif
          </title>
        </Helmet>

        <AdminLayout backLink={<div className="flex items-center gap-4 my-4">
          <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/events')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditMode 
              ? `Modifier l'${eventType === 'neighborhood' ? 'événement de voisinage' : 'événement'}`
              : `Créer un ${eventType === 'neighborhood' ? 'Café de quartier' : 'événement'}`
            }
          </h1>
        </div>}>

          <div className="flex-grow container mx-auto px-4 py-8">
            {isLoadingEvent ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
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

                      {/* Sélecteur de type d'événement */}
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <Label htmlFor="event-type" className="text-base font-medium">Type d'événement *</Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Choisissez le type d'événement pour adapter les options disponibles
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                            eventType === 'regular' 
                              ? 'border-getigne-accent bg-getigne-accent/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <input
                              type="radio"
                              name="event-type"
                              value="regular"
                              checked={eventType === 'regular'}
                              onChange={(e) => handleEventTypeChange(e.target.value as 'regular' | 'neighborhood')}
                              className="sr-only"
                            />
                            <div className="flex items-center gap-3">
                              <Calendar className={`w-5 h-5 ${
                                eventType === 'regular' ? 'text-getigne-accent' : 'text-gray-400'
                              }`} />
                              <div>
                                <div className="font-medium">Événement régulier</div>
                                <div className="text-sm text-gray-600">
                                  Réunion publique, atelier, conférence...
                                </div>
                              </div>
                            </div>
                          </label>

                          <label className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                            eventType === 'neighborhood' 
                              ? 'border-getigne-accent bg-getigne-accent/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <input
                              type="radio"
                              name="event-type"
                              value="neighborhood"
                              checked={eventType === 'neighborhood'}
                              onChange={(e) => handleEventTypeChange(e.target.value as 'regular' | 'neighborhood')}
                              className="sr-only"
                            />
                            <div className="flex items-center gap-3">
                              <Coffee className={`w-5 h-5 ${
                                eventType === 'neighborhood' ? 'text-getigne-accent' : 'text-gray-400'
                              }`} />
                              <div>
                                <div className="font-medium">Café de quartier</div>
                                <div className="text-sm text-gray-600">
                                  Rencontre de voisinage, échange local
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      </div>

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
                        <Label>Contenu détaillé</Label>
                        <div className="mt-2 border rounded-md">
                          <MarkdownEditor
                            value={content}
                            onChange={setContent}
                            contentType="event"
                          />
                        </div>
                      </div>

                      {/* Champs spécifiques aux événements de voisinage */}
                      {eventType === 'neighborhood' && (
                        <div className="space-y-4 p-4 bg-getigne-accent/5 rounded-lg border border-getigne-accent/20">
                          <div className="flex items-center gap-2 text-getigne-accent font-medium">
                            <Coffee className="w-5 h-5" />
                            Informations Café de quartier
                          </div>

                          {/* Organisateur */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="organizer-name">Nom de l'organisateur</Label>
                              <Input
                                id="organizer-name"
                                value={organizerName}
                                onChange={(e) => setOrganizerName(e.target.value)}
                                placeholder="Jean Dupont"
                              />
                            </div>
                            <div>
                              <Label htmlFor="organizer-contact">Contact organisateur</Label>
                              <Input
                                id="organizer-contact"
                                value={organizerContact}
                                onChange={(e) => setOrganizerContact(e.target.value)}
                                placeholder="email@example.com ou 06 12 34 56 78"
                              />
                            </div>
                          </div>

                          {/* Coordonnées GPS */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="latitude">Latitude</Label>
                              <Input
                                id="latitude"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                placeholder="47.0847"
                                type="number"
                                step="any"
                              />
                            </div>
                            <div>
                              <Label htmlFor="longitude">Longitude</Label>
                              <Input
                                id="longitude"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                placeholder="-1.2614"
                                type="number"
                                step="any"
                              />
                            </div>
                          </div>

                          {/* Options */}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="kit-provided"
                                checked={kitProvided}
                                onCheckedChange={setKitProvided}
                              />
                              <Label htmlFor="kit-provided" className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-getigne-accent" />
                                Kit d'organisation fourni
                              </Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="member-present"
                                checked={memberPresent}
                                onCheckedChange={setMemberPresent}
                              />
                              <Label htmlFor="member-present" className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-getigne-accent" />
                                Membre du collectif présent
                              </Label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-3 justify-end">
                      {isEditMode && slug && (
                        <Button
                          type="button"
                          variant="outline"
                          size='sm'
                          onClick={() => window.open(`/agenda/${slug}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Prévisualiser
                        </Button>
                      )}
                      <Button
                        type="submit"
                        size='sm'
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        {isEditMode ? "Enregistrer" : "Publier"}
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

                    <div>
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

                    <div className="bg-getigne-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-4">Paramètres d'inscription</h3>
                      
                      <div className="space-y-4">
                        {eventType === 'regular' ? (
                          <>
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
                          </>
                        ) : (
                          <div className="text-sm text-getigne-600 bg-getigne-accent/10 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Coffee className="w-4 h-4 text-getigne-accent" />
                              <span className="font-medium">Café de quartier</span>
                            </div>
                            <p>
                              Les cafés de quartier sont des événements ouverts à tous les habitants du secteur. 
                              L'inscription n'est généralement pas requise pour ce type de rencontre conviviale.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!isEditMode && (
                      <div className="bg-getigne-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-4">Paramètres Discord</h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="create-discord-event" className="font-medium">Créer un événement Discord</Label>
                              <p className="text-sm text-getigne-500">Ajouter automatiquement l'événement au serveur Discord</p>
                            </div>
                            <Switch 
                              id="create-discord-event" 
                              checked={createDiscordScheduledEvent} 
                              onCheckedChange={setCreateDiscordScheduledEvent} 
                            />
                          </div>
                          
                          {createDiscordScheduledEvent && (
                            <div>
                              <Label htmlFor="duration">Durée estimée (heures)</Label>
                              <Input
                                id="duration"
                                type="number"
                                min="1"
                                max="12"
                                value={estimatedDuration}
                                onChange={(e) => setEstimatedDuration(parseInt(e.target.value))}
                              />
                              <p className="text-sm text-getigne-500 mt-1">
                                Durée estimée de l'événement pour le calendrier Discord
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
                </div>
              </form>
            )}
          </div>
        </AdminLayout>
      </HelmetProvider>
  );
};

export default AdminEventEditorPage;

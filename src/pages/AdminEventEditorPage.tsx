
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Eye, ArrowLeft } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import EventRegistrationAdmin from '@/components/events/EventRegistrationAdmin';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth';

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
  const { isAdmin, isModerator } = useAuth();
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
        .single();
      
      if (error) throw error;
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

  const handleSubmit = async (e: React.FormEvent, saveStatus: 'draft' | 'published' | 'archived' = 'published') => {
    e.preventDefault();
    
    if (!title || !date || !location || !description || !image) {
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
      
      const eventData = {
        title,
        date,
        location,
        description,
        content,
        image,
        committee_id: committeeId || null,
        committee: committeeId ? committees.find(c => c.id === committeeId)?.title : null,
        allow_registration: allowRegistration,
        is_members_only: isMembersOnly,
        status: saveStatus,
        slug: eventSlug
      };
      
      let result;
      
      if (isEditMode) {
        const { data, error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        
        toast({
          title: "Événement mis à jour",
          description: "L'événement a été mis à jour avec succès",
        });
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert(eventData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        
        toast({
          title: "Événement créé",
          description: "L'événement a été créé avec succès",
        });
      }
      
      navigate('/evenements');
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

  const handleRegistrationUpdate = () => {
    // This function will be called after EventRegistrationAdmin updates registration settings
    // Refresh event data if needed
    if (id) {
      // Refetch event data
    }
  };

  if (!isAdmin && !isModerator) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold">Accès refusé</h1>
            <p className="mt-4">Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</p>
            <Button onClick={() => navigate('/')} className="mt-6">
              Retour à l'accueil
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="mr-2"
            onClick={() => navigate('/evenements')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Modifier l\'événement' : 'Créer un nouvel événement'}
          </h1>
        </div>
        
        {isLoadingEvent ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
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
                    <Label htmlFor="image">URL de l'image *</Label>
                    <Input
                      id="image"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="URL de l'image"
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
                  
                  <div>
                    <Label>Contenu détaillé</Label>
                    <div className="mt-2 border rounded-md">
                      <RichTextEditor
                        value={content}
                        onChange={setContent}
                        placeholder="Contenu détaillé de l'événement..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => handleSubmit(e, 'draft')}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Enregistrer comme brouillon
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Publier
                  </Button>
                </div>
              </form>
            </div>
            
            <div className="space-y-6">
              {isEditMode && (
                <EventRegistrationAdmin
                  eventId={id || ''}
                  isAllowRegistration={allowRegistration}
                  isMembersOnly={isMembersOnly}
                  onUpdate={handleRegistrationUpdate}
                />
              )}
              
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
              
              <div className="bg-getigne-50 p-4 rounded-lg">
                <h3 className="font-medium mb-4">Prévisualisation</h3>
                {isEditMode && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(`/evenements/${id}`, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Prévisualiser
                  </Button>
                )}
                {!isEditMode && (
                  <p className="text-sm text-getigne-500">
                    La prévisualisation sera disponible après la création de l'événement.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminEventEditorPage;

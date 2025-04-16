import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { useAuth } from '@/context/AuthContext.tsx';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar.tsx';
import Footer from '@/components/Footer.tsx';
import { Calendar as CalendarIcon, CheckCheck, Clock, Copy, Globe, Lock, Plus, Send, Trash, Upload, User, Users } from 'lucide-react';
import { addHours, format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { cn } from "@/lib/utils.ts";
import { da } from "date-fns/locale";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb.tsx";
import { Home } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client.ts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.tsx";
import { Loader2 } from 'lucide-react';
import { Switch } from "@/components/ui/switch.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import AdminLayout from "@/components/admin/AdminLayout.tsx";

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Le titre doit comporter au moins 3 caractères.",
  }),
  description: z.string().min(10, {
    message: "La description doit comporter au moins 10 caractères.",
  }),
  date: z.date(),
  location: z.string().optional(),
  image: z.string().url({
    message: "L'URL de l'image doit être valide.",
  }).optional(),
  registration_link: z.string().url({
    message: "Le lien d'inscription doit être une URL valide.",
  }).optional(),
  max_participants: z.number().optional(),
  is_free: z.boolean().default(true),
  is_online: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_visible: z.boolean().default(true),
});

const AdminEventEditorPage = () => {
  const { id } = useParams();
  const { user, isAdmin, authChecked } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationSent, setNotificationSent] = useState(false);
  const [eventCreated, setEventCreated] = useState(false);
  const [isNewEvent, setIsNewEvent] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (user && isAdmin) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      if (user) {
        toast({
          title: "Accès restreint",
          description: "Vous n'avez pas les droits nécessaires pour accéder à cette page.",
          variant: "destructive"
        });
        navigate('/');
      } else {
        navigate('/auth');
      }
    }
    setIsChecking(false);
  }, [user, isAdmin, authChecked, navigate]);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setLoading(false);
        setIsNewEvent(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        const eventWithDateObj = {
          ...data,
          date: data.date ? new Date(data.date) : new Date()
        };

        setEvent(data);
        form.reset(eventWithDateObj);
      } catch (error) {
        console.error("Erreur lors de la récupération de l'événement:", error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer l'événement.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      location: "",
      image: "",
      registration_link: "",
      max_participants: undefined,
      is_free: true,
      is_online: false,
      is_featured: false,
      is_visible: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      if (id) {
        const dbValues = {
          ...values,
          date: values.date.toISOString()
        };

        const { data, error } = await supabase
          .from('events')
          .update(dbValues)
          .eq('id', id);

        if (error) throw error;

        toast("Événement mis à jour avec succès", {
          description: "Les modifications ont été enregistrées",
        });
      } else {
        const dbValues = {
          ...values,
          date: values.date.toISOString()
        };

        const { data, error } = await supabase
          .from('events')
          .insert([dbValues])
          .select();

        if (error) throw error;

        toast("Événement créé avec succès", {
          description: "Le nouvel événement a été ajouté",
        });
        navigate('/admin/events');

        if (data && data.length > 0) {
          const newEvent = data[0];
          sendDiscordNotification(newEvent);
          createDiscordEvent(newEvent);
        }
      }
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde de l'événement:", error);
      toast("Erreur lors de la sauvegarde de l'événement", {
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast("Événement supprimé avec succès", {
        description: "L'événement a été supprimé définitivement",
      });
      navigate('/admin/events');
    } catch (error: any) {
      console.error("Erreur lors de la suppression de l'événement:", error);
      toast("Erreur lors de la suppression de l'événement", {
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendDiscordNotification = async (event: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('discord-notify', {
        body: {
          content: `🎉 Nouvel événement : ${event.title} - ${new Date(event.date).toLocaleDateString('fr-FR')}`,
          embeds: [
            {
              title: event.title,
              description: event.description,
              url: `${window.location.origin}/agenda/${event.id}`,
              color: 5814783,
              fields: [
                {
                  name: "Date",
                  value: new Date(event.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  inline: true
                },
                {
                  name: "Lieu",
                  value: event.location || "À définir",
                  inline: true
                }
              ],
              image: { url: event.image }
            }
          ]
        }
      });

      if (error) throw error;
      setNotificationSent(true);
      toast("Notification Discord envoyée avec succès", {
        description: "L'événement a été annoncé sur Discord",
      });
    } catch (error: any) {
      console.error("Erreur lors de l'envoi de la notification Discord:", error);
      toast("Erreur lors de l'envoi de la notification Discord", {
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const createDiscordEvent = async (event: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('discord-create-event', {
        body: {
          title: event.title,
          description: event.description,
          start_time: new Date(event.date).toISOString(),
          end_time: addHours(new Date(event.date), 2).toISOString(),
          location: event.location,
          image: event.image,
          url: `${window.location.origin}/agenda/${event.id}`
        }
      });

      if (error) throw error;
      setEventCreated(true);
      toast("Événement Discord créé avec succès", {
        description: "L'événement a été ajouté au calendrier Discord",
      });
    } catch (error: any) {
      console.error("Erreur lors de la création de l'événement Discord:", error);
      toast("Erreur lors de la création de l'événement Discord", {
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Vérification des droits d'accès...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>{id ? `Modifier l'événement | Administration | Gétigné Collectif` : `Nouvel événement | Administration | Gétigné Collectif`}</title>
        <meta
          name="description"
          content="Administration des événements du site Gétigné Collectif."
        />
      </Helmet>

      <AdminLayout title={id ? "Modifier l'événement" : "Nouvel événement"} description="Gérez les événements du site Gétigné Collectif." breadcrumb={<>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/admin/events">Événements</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{id ? "Modifier" : "Nouveau"}</BreadcrumbPage>
        </BreadcrumbItem>
      </>}>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>{id ? "Modifier l'événement" : "Créer un événement"}</CardTitle>
                <CardDescription>
                  {id ? "Modifiez les informations de l'événement." : "Créez un nouvel événement pour le site."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Titre</FormLabel>
                            <FormControl>
                              <Input placeholder="Titre de l'événement" {...field} />
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
                              <Textarea
                                placeholder="Description de l'événement"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date et heure</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-[240px] pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP HH:mm", { locale: da })
                                    ) : (
                                      <span>Choisir une date et une heure</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  locale={da}
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date()
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              Choisissez la date et l'heure de l'événement.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lieu</FormLabel>
                            <FormControl>
                              <Input placeholder="Lieu de l'événement" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image (URL)</FormLabel>
                            <FormControl>
                              <Input placeholder="URL de l'image de l'événement" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="registration_link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lien d'inscription</FormLabel>
                            <FormControl>
                              <Input placeholder="Lien pour s'inscrire à l'événement" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="max_participants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre maximum de participants</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Nombre maximum de participants"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center space-x-2">
                        <FormField
                          control={form.control}
                          name="is_free"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-md border p-4 space-y-0">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Événement gratuit</FormLabel>
                                <FormDescription>
                                  Indiquez si l'événement est gratuit ou payant.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="is_online"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-md border p-4 space-y-0">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Événement en ligne</FormLabel>
                                <FormDescription>
                                  Indiquez si l'événement se déroule en ligne.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="is_featured"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-md border p-4 space-y-0">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Événement mis en avant</FormLabel>
                                <FormDescription>
                                  Mettre en avant cet événement sur la page d'accueil.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="is_visible"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-md border p-4 space-y-0">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Événement visible</FormLabel>
                                <FormDescription>
                                  Définir si l'événement est visible sur le site.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button disabled={loading} type="submit">
                        {loading ? (
                          <>
                            Enregistrement...
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          </>
                        ) : (
                          "Enregistrer"
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
              {id && (
                <CardFooter className="flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        Suppression...
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      "Supprimer"
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </AdminLayout>
    </HelmetProvider>
  );
};

export default AdminEventEditorPage;

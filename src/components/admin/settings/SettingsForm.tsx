
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const formSchema = z.object({
  site_name: z.string().min(2, {
    message: 'Le nom du site doit comporter au moins 2 caractères.',
  }),
  site_description: z.string().min(10, {
    message: 'La description du site doit comporter au moins 10 caractères.',
  }),
  contact_email: z.string().email({
    message: 'Veuillez entrer une adresse email valide.',
  }),
  maintenance_mode: z.boolean().default(false),
  maintenance_message: z.string().optional(),
  social_facebook: z.string().url({
    message: 'Veuillez entrer une URL valide.',
  }).optional().or(z.literal('')),
  social_twitter: z.string().url({
    message: 'Veuillez entrer une URL valide.',
  }).optional().or(z.literal('')),
  social_instagram: z.string().url({
    message: 'Veuillez entrer une URL valide.',
  }).optional().or(z.literal('')),
  social_linkedin: z.string().url({
    message: 'Veuillez entrer une URL valide.',
  }).optional().or(z.literal('')),
  social_youtube: z.string().url({
    message: 'Veuillez entrer une URL valide.',
  }).optional().or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof formSchema>;

export default function SettingsForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      site_name: '',
      site_description: '',
      contact_email: '',
      maintenance_mode: false,
      maintenance_message: '',
      social_facebook: '',
      social_twitter: '',
      social_instagram: '',
      social_linkedin: '',
      social_youtube: '',
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*');

        if (error) throw error;

        // Convertir les données en format attendu par le formulaire
        const settingsMap: Record<string, any> = {};
        data?.forEach(setting => {
          settingsMap[setting.key] = setting.value;
        });

        if (data && data.length > 0) {
          form.reset({
            site_name: settingsMap.site_name || '',
            site_description: settingsMap.site_description || '',
            contact_email: settingsMap.contact_email || '',
            maintenance_mode: settingsMap.maintenance_mode || false,
            maintenance_message: settingsMap.maintenance_message || '',
            social_facebook: settingsMap.social_facebook || '',
            social_twitter: settingsMap.social_twitter || '',
            social_instagram: settingsMap.social_instagram || '',
            social_linkedin: settingsMap.social_linkedin || '',
            social_youtube: settingsMap.social_youtube || '',
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error("Impossible de charger les paramètres du site.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [form]);

  const onSubmit = async (values: SettingsFormValues) => {
    setIsSaving(true);
    try {
      // Convertir les valeurs en format app_settings
      const updates = Object.entries(values).map(([key, value]) => ({
        key,
        value,
        description: getDescriptionForKey(key)
      }));

      // Mettre à jour ou insérer chaque paramètre
      for (const update of updates) {
        const { error } = await supabase
          .from('app_settings')
          .upsert(update, { onConflict: 'key' });

        if (error) throw error;
      }

      toast.success("Les paramètres du site ont été mis à jour avec succès.");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Impossible d'enregistrer les paramètres du site.");
    } finally {
      setIsSaving(false);
    }
  };

  const getDescriptionForKey = (key: string): string => {
    const descriptions: Record<string, string> = {
      site_name: 'Nom du site',
      site_description: 'Description du site',
      contact_email: 'Email de contact',
      maintenance_mode: 'Mode maintenance',
      maintenance_message: 'Message de maintenance',
      social_facebook: 'URL Facebook',
      social_twitter: 'URL Twitter',
      social_instagram: 'URL Instagram',
      social_linkedin: 'URL LinkedIn',
      social_youtube: 'URL YouTube'
    };
    return descriptions[key] || key;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Paramètres généraux</CardTitle>
            <CardDescription>
              Configurez les informations de base du site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="site_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du site</FormLabel>
                  <FormControl>
                    <Input placeholder="Gétigné Collectif" {...field} />
                  </FormControl>
                  <FormDescription>
                    Ce nom apparaît dans le titre des pages et dans l'en-tête du site.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="site_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description du site</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Une description concise du site..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Cette description est utilisée pour le référencement et les partages sur les réseaux sociaux.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de contact</FormLabel>
                  <FormControl>
                    <Input placeholder="contact@getigne-collectif.fr" {...field} />
                  </FormControl>
                  <FormDescription>
                    Adresse email principale pour les contacts via le site.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mode maintenance</CardTitle>
            <CardDescription>
              Activez le mode maintenance pour afficher un message temporaire aux visiteurs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="maintenance_mode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Activer le mode maintenance
                    </FormLabel>
                    <FormDescription>
                      Lorsqu'il est activé, les visiteurs verront un message de maintenance au lieu du contenu normal.
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
              name="maintenance_message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message de maintenance</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notre site est actuellement en maintenance. Nous serons de retour très bientôt !"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Ce message sera affiché aux visiteurs lorsque le mode maintenance est activé.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Réseaux sociaux</CardTitle>
            <CardDescription>
              Configurez les liens vers vos profils de réseaux sociaux.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="social_facebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook</FormLabel>
                  <FormControl>
                    <Input placeholder="https://facebook.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="social_twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter</FormLabel>
                  <FormControl>
                    <Input placeholder="https://twitter.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="social_instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <Input placeholder="https://instagram.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="social_linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="social_youtube"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube</FormLabel>
                  <FormControl>
                    <Input placeholder="https://youtube.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer les paramètres"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

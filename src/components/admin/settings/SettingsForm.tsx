
import { useEffect, useState } from 'react';
import { useForm, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { useAppSettings } from '@/hooks/useAppSettings';
import { SiteSettings, siteSettingsSchema } from '@/config/siteSettings';

type SettingsFormValues = SiteSettings;

export default function SettingsForm() {
  const { settings, loading, updateSettings } = useAppSettings();
  const [isSaving, setIsSaving] = useState(false);
  const moduleFields: { name: Path<SettingsFormValues>; label: string }[] = [
    { name: 'modules.program', label: 'Programme' },
    { name: 'modules.supportCommittee', label: 'Comité de soutien' },
    { name: 'modules.membershipForm', label: "Formulaire d'adhésion" },
    { name: 'modules.agenda', label: 'Agenda' },
    { name: 'modules.blog', label: 'Blog / Actualités' },
    { name: 'modules.proxy', label: 'Espace procuration' },
    { name: 'modules.committees', label: 'Comités citoyens' },
    { name: 'modules.projects', label: 'Projets citoyens' },
    { name: 'modules.committeeWorksPublic', label: 'Travaux des commissions (public)' },
  ];

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    if (!loading) {
      form.reset(settings);
    }
  }, [form, loading, settings]);

  const onSubmit = async (values: SettingsFormValues) => {
    setIsSaving(true);
    try {
      const ok = await updateSettings(values);
      if (!ok) throw new Error('Update failed');
      toast.success("Les paramètres du site ont été mis à jour avec succès.");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Impossible d'enregistrer les paramètres du site.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
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
            <CardTitle>Personnalisation</CardTitle>
            <CardDescription>
              Identité visuelle et informations de base du site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="branding.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du collectif</FormLabel>
                    <FormControl>
                      <Input placeholder="Gétigné Collectif" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branding.slogan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slogan</FormLabel>
                    <FormControl>
                      <Input placeholder="Élections municipales 2026" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branding.logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo (URL)</FormLabel>
                    <FormControl>
                      <Input placeholder="/images/logo.png" {...field} />
                    </FormControl>
                    <FormDescription>
                      Chemin relatif ou URL absolue.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branding.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl>
                      <Input placeholder="Gétigné" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-5 gap-4">
              <FormField
                control={form.control}
                name="branding.colors.green"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vert</FormLabel>
                    <FormControl>
                      <Input placeholder="#34b190" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branding.colors.yellow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jaune</FormLabel>
                    <FormControl>
                      <Input placeholder="#fbbf24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branding.colors.orange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orange</FormLabel>
                    <FormControl>
                      <Input placeholder="#f97316" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branding.colors.blue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bleu</FormLabel>
                    <FormControl>
                      <Input placeholder="#2563eb" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branding.colors.red"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rouge</FormLabel>
                    <FormControl>
                      <Input placeholder="#dc2626" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="branding.images.hero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo hero</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branding.images.campaign"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo campagne</FormLabel>
                    <FormControl>
                      <Input placeholder="/images/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branding.images.neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo cafés de quartier</FormLabel>
                    <FormControl>
                      <Input placeholder="/images/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Textes, contact et carte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="content.heroTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre hero (ligne 1)</FormLabel>
                    <FormControl>
                      <Input placeholder="Vivre dans une commune" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content.heroTitleEmphasis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre hero (mise en avant)</FormLabel>
                    <FormControl>
                      <Input placeholder="dynamique, engagée et démocratique" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content.heroTitleSuffix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre hero (ligne 3)</FormLabel>
                    <FormControl>
                      <Input placeholder="ça vous tente ?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content.siteDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description du site</FormLabel>
                    <FormControl>
                      <Input placeholder="Description courte pour le SEO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="content.heroSubtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sous-titre hero</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content.footerAbout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texte footer</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="content.contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de contact</FormLabel>
                    <FormControl>
                      <Input placeholder="contact@..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content.contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="06 00 00 00 00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content.contactAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="map.center.lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="map.center.lng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="map.zoom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zoom</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modules</CardTitle>
            <CardDescription>
              Activez ou désactivez les modules publics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {moduleFields.map((item) => (
              <FormField
                key={item.name}
                control={form.control}
                name={item.name}
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <FormLabel className="text-base">{item.label}</FormLabel>
                    <FormControl>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer les paramètres'
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

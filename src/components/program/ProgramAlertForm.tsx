import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { subscribeToNewsletter } from '@/utils/newsletter';
import { sendDiscordNotification, DiscordColors } from '@/utils/notifications';
import { BookOpen, Mail, Bell } from 'lucide-react';

// Schéma de validation pour le formulaire
const formSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères' }),
  email: z.string().email({ message: 'Adresse email invalide' }),
  newsletter: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ProgramAlertForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      newsletter: true,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Envoyer une notification Discord
      await sendDiscordNotification({
        title: "Alerte programme - Nouvel inscrit",
        message: `Nom: ${data.name}\nEmail: ${data.email}\nNewsletter: ${data.newsletter ? 'Oui' : 'Non'}`,
        color: DiscordColors.BLUE,
        username: "Programme Bot",
        resourceType: 'user'
      });
      
      // Si l'utilisateur a coché la case newsletter, l'inscrire à la newsletter
      if (data.newsletter) {
        await subscribeToNewsletter({
          email: data.email,
        });
      }
      
      toast({
        title: "Inscription réussie",
        description: "Vous serez informé de la sortie du programme.",
      });
      
      form.reset();
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Un problème est survenu lors de votre inscription.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-getigne-100 p-6">
      <div className="flex flex-col items-center mb-4">
        <div className="w-12 h-12 bg-getigne-accent/10 rounded-full flex items-center justify-center mb-3">
          <Bell className="h-6 w-6 text-getigne-accent" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-center">Soyez informé en premier !</h3>
        <p className="text-getigne-700 text-sm text-center max-w-sm mx-auto">
          Laissez-nous vos coordonnées et vous recevrez un email
          dès que le programme sera publié.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Nom</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input placeholder="Votre nom" {...field} className="pl-9 h-10" />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-getigne-500">
                      <BookOpen className="h-4 w-4" />
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input placeholder="votre@email.com" type="email" {...field} className="pl-9 h-10" />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-getigne-500">
                      <Mail className="h-4 w-4" />
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="newsletter"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm">
                    Je souhaite m'inscrire à la newsletter
                  </FormLabel>
                  <p className="text-xs text-getigne-600">
                    Recevez nos actualités et événements
                  </p>
                </div>
              </FormItem>
            )}
          />
          
          <Button type="submit" disabled={isSubmitting} className="w-full bg-getigne-accent hover:bg-getigne-accent/90 transition-colors h-10">
            {isSubmitting ? "Inscription en cours..." : "M'inscrire"}
          </Button>
        </form>
      </Form>

      <div className="mt-4 pt-4 border-t border-getigne-100 text-center">
        <p className="text-xs text-getigne-600">
          Vos données personnelles sont utilisées uniquement pour vous informer de la sortie du programme et vous inscrire à la newsletter si vous avez coché la case.
          Elles ne seront pas partagées avec des tiers.
        </p>
      </div>
    </div>
  );
};

export default ProgramAlertForm;

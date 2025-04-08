
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
          name: data.name,
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
    <div className="bg-white rounded-xl shadow-sm border border-getigne-100 p-6">
      <h3 className="text-xl font-semibold mb-4 text-center">Vous souhaitez être prévenu·e ?</h3>
      <p className="text-getigne-700 mb-6 text-center">
        Laissez-nous vos coordonnées et vous recevrez un email<br/>dès que le programme sera publié.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Votre nom" {...field} />
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="votre@email.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="newsletter"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Je souhaite m'inscrire à la newsletter
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Inscription en cours..." : "M'inscrire"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ProgramAlertForm;

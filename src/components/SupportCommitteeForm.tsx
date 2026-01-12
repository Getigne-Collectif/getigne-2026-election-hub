
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { subscribeToNewsletter } from '@/utils/newsletter';
import { Checkbox } from './ui/checkbox';

interface SupportCommitteeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function SupportCommitteeForm({ open, onOpenChange, onSuccess }: SupportCommitteeFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribe, setSubscribe] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    city: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || ''
      }));
    }
  }, [user, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Veuillez remplir les champs Prénom, Nom et Email.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Insert into support_committee table
      const { error: insertError } = await supabase
        .from('support_committee')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          city: formData.city,
          subscribed_to_newsletter: subscribe
        });

      if (insertError) {
        if (insertError.code === '23505') { // unique_violation
          toast.info("Vous avez déjà signé le comité de soutien. Merci !");
        } else {
          throw insertError;
        }
      } else {
        toast.success("Merci pour votre soutien ! Votre nom a été ajouté à la liste.");
      }
      
      // 2. Subscribe to newsletter if checked
      if (subscribe) {
        try {
          await subscribeToNewsletter({
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            source: 'Comité de soutien'
          });
          toast.info("Vous avez également été inscrit(e) à notre newsletter.");
        } catch (newsletterError) {
            // Log error but don't block the main success
            console.error("Erreur d'inscription à la newsletter:", newsletterError);
            toast.warning("Nous n'avons pas pu vous inscrire à la newsletter pour le moment.");
        }
      }
      
      onSuccess();

    } catch (error) {
      console.error('Erreur lors de la signature:', error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Signer le comité de soutien</DialogTitle>
          <DialogDescription>
            Remplissez ce formulaire pour afficher publiquement votre soutien. Votre email ne sera jamais partagé.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Votre prénom"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Votre nom"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="votre@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
             <p className="text-xs text-gray-500">Votre email reste confidentiel et ne sera pas affiché publiquement.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ville (optionnel)</Label>
            <Input
              id="city"
              name="city"
              placeholder="Ex: Gétigné"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="subscribe" checked={subscribe} onCheckedChange={(checked) => setSubscribe(!!checked)} />
            <Label htmlFor="subscribe" className="text-sm font-normal">
                Je souhaite m'abonner à la newsletter pour rester informé(e) des actualités du collectif.
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Envoi en cours...' : 'Je soutiens !'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth';
import { toast } from 'sonner';
import { sendDiscordNotification, DiscordColors } from '@/utils/notifications';

interface ProjectProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProjectProposalModal({ open, onOpenChange }: ProjectProposalModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });
  
  // Pre-fill the form with user data if available
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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.message) {
      toast.error("Veuillez au moins saisir un message décrivant votre projet.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Construire les détails du contact en fonction des informations disponibles
      const contactDetails = [];
      if (formData.firstName || formData.lastName) {
        contactDetails.push(`**Nom**: ${formData.firstName} ${formData.lastName}`);
      }
      if (formData.email) {
        contactDetails.push(`**Email**: ${formData.email}`);
      }
      if (formData.phone) {
        contactDetails.push(`**Téléphone**: ${formData.phone}`);
      }

      // Envoyer notification Discord
      await sendDiscordNotification({
        title: `🚀 Nouvelle proposition de projet`,
        message: `
${contactDetails.join('\n')}

**Description du projet**:
${formData.message}
        `,
        color: DiscordColors.GREEN,
        username: "Propositions de Projets"
      });
      
      toast.success("Votre proposition de projet a été envoyée avec succès ! Nous vous contacterons bientôt.");
      
      // Réinitialiser le formulaire (sauf données utilisateur)
      setFormData(prev => ({
        ...prev,
        message: '',
        phone: ''
      }));
      
      // Fermer la modale
      onOpenChange(false);
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la proposition:', error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Proposer un projet</DialogTitle>
          <DialogDescription>
            Partagez votre idée de projet pour Gétigné. Nous vous recontacterons pour en discuter.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Votre prénom"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Votre nom"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="votre@email.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone (optionnel)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="06 XX XX XX XX"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Description de votre projet</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Décrivez votre idée de projet pour Gétigné..."
              rows={5}
              value={formData.message}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { sendDiscordNotification, DiscordColors } from '@/utils/notifications';

interface CommitteeContactFormProps {
  committeeId: string;
  committeeName: string;
  themeColor: {
    bg: string;
    text: string;
    border: string;
    hover: string;
    accent: string;
  };
}

export const CommitteeContactForm = ({ committeeId, committeeName, themeColor }: CommitteeContactFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Envoi de la notification Discord
      await sendDiscordNotification({
        title: `🤝 Demande d'information commission: ${committeeName}`,
        message: `
**De**: ${formData.firstName} ${formData.lastName}
**Email**: ${formData.email}
**Téléphone**: ${formData.phone || 'Non fourni'}

**Message**:
${formData.message}
        `,
        color: DiscordColors.PURPLE,
        username: "Formulaire Commission"
      });

      // Clear form data
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: ''
      });

      toast({
        title: "Demande envoyée",
        description: `Votre message a bien été transmis au pilote de la commission ${committeeName}. Vous serez contacté prochainement.`,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer ultérieurement.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white shadow-sm rounded-xl p-6 border ${themeColor.border}`}>
      <h2 className="text-2xl font-bold mb-6">Contacter la commission</h2>
      <p className="text-getigne-700 mb-6">
        Vous souhaitez joindre (ou rejoindre 😉) la commission {committeeName} ?
        Remplissez ce formulaire, nous vous répondrons dans les plus brefs délais.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="firstName" className="text-sm font-medium text-getigne-700">
              Prénom
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="w-full border border-getigne-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-getigne-accent"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lastName" className="text-sm font-medium text-getigne-700">
              Nom
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="w-full border border-getigne-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-getigne-accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-getigne-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-getigne-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-getigne-accent"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-getigne-700">
              Téléphone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-getigne-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-getigne-accent"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium text-getigne-700">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            required
            value={formData.message}
            onChange={handleChange}
            className="w-full border border-getigne-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-getigne-accent"
            placeholder="Partagez vos motivations ou posez vos questions..."
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className={`${themeColor.accent} ${themeColor.text} px-6 py-2 rounded-md font-medium hover:opacity-90 transition-opacity`}
        >
          {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma demande'}
        </Button>
      </form>
    </div>
  );
};

export default CommitteeContactForm;

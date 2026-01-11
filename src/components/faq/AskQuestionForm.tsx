import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, CheckCircle, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { sendDiscordNotification, DiscordColors } from '@/utils/notifications';

const AskQuestionForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await sendDiscordNotification({
        title: 'Nouvelle question depuis la FAQ',
        message: `
**De**: ${formData.firstName} ${formData.lastName} (${formData.email})

**Question**:
${formData.message}
        `,
        color: DiscordColors.BLUE,
        username: "FAQ - Nouvelle Question"
      });

      setSubmittedName(formData.firstName);
      setIsSubmitted(true);
      setFormData({ firstName: '', lastName: '', email: '', message: '' });

    } catch (error) {
      console.error("Erreur lors de l'envoi de la question:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResetForm = () => {
    setIsSubmitted(false);
    setSubmittedName('');
  }

  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Question envoyée !
        </h3>
        <p className="text-gray-600 mb-6">
          Merci, {submittedName}. Nous avons bien reçu votre question et y répondrons dès que possible.
        </p>
        <Button variant="outline" onClick={handleResetForm}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Poser une autre question
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-4 mt-8" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" value={formData.firstName} onChange={handleChange} placeholder="Votre prénom" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" value={formData.lastName} onChange={handleChange} placeholder="Votre nom" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input type="email" id="email" value={formData.email} onChange={handleChange} placeholder="votre.email@exemple.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Votre question</Label>
        <Textarea id="message" value={formData.message} onChange={handleChange} placeholder="Posez votre question ici..." required />
      </div>
      <div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma question'}
        </Button>
      </div>
    </form>
  );
};

export default AskQuestionForm;


import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { sendDiscordNotification, DiscordColors } from '@/utils/notifications';

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Envoyer notification Discord
      await sendDiscordNotification({
        title: `📬 Nouveau message de contact : ${formData.subject || 'Sans sujet'}`,
        message: `
**De**: ${formData.firstName} ${formData.lastName} (${formData.email})

**Message**:
${formData.message}
        `,
        color: DiscordColors.BLUE,
        username: "Formulaire de Contact"
      });
      
      // Réinitialiser le formulaire
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        subject: '',
        message: ''
      });
      
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.",
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-center">Contactez-nous</h1>
          <p className="text-getigne-700 text-center">
            Vous avez des questions ou des suggestions ? N'hésitez pas à nous contacter.
          </p>
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8 mt-5">
            <div className="text-center mb-10">

            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-getigne-800 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-getigne-200 rounded-md focus:outline-none focus:ring-2 focus:ring-getigne-green-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-getigne-800 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-getigne-200 rounded-md focus:outline-none focus:ring-2 focus:ring-getigne-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-getigne-800 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-getigne-200 rounded-md focus:outline-none focus:ring-2 focus:ring-getigne-green-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-getigne-800 mb-1">
                  Sujet
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-getigne-200 rounded-md focus:outline-none focus:ring-2 focus:ring-getigne-green-500"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-getigne-800 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-getigne-200 rounded-md focus:outline-none focus:ring-2 focus:ring-getigne-green-500"
                  required
                ></textarea>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-getigne-green-500 hover:bg-getigne-green-600 text-white"
                disabled={isSubmitting}
              >
                <Send className="mr-2 h-4 w-4" /> {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
              </Button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;

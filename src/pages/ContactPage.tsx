
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Send, Mail, Phone, MapPin, Clock, MessageCircle, Users, Heart } from 'lucide-react';
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

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-br from-getigne-50 to-getigne-100">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm">
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact & Support
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-getigne-900">
            Contactez-nous
          </h1>
          <p className="text-xl text-getigne-700 max-w-3xl mx-auto leading-relaxed">
            Vous avez des questions, des suggestions ou souhaitez rejoindre notre collectif ? 
            Nous sommes là pour vous écouter et vous accompagner.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Informations de contact */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-getigne-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-getigne-900">
                    <Users className="w-5 h-5 mr-2 text-getigne-green-600" />
                    Qui sommes-nous ?
                  </CardTitle>
                  <CardDescription>
                    Une équipe d'élus, d'experts et de bénévoles engagés pour Gétigné
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-getigne-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 text-getigne-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-getigne-900">Gétigné Collectif</h4>
                      <p className="text-sm text-getigne-600">Association citoyenne engagée</p>
                    </div>
                  </div>
                  <Separator />
                  <p className="text-sm text-getigne-700">
                    Notre équipe de bénévoles est disponible pour répondre à vos questions 
                    et vous accompagner dans vos projets citoyens.
                  </p>
                </CardContent>
              </Card>

            </div>

            {/* Formulaire de contact */}
            <div className="lg:col-span-2">
              <Card className="border-getigne-200 shadow-sm">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-getigne-900">
                    Envoyez-nous un message
                  </CardTitle>
                  <CardDescription>
                    Remplissez le formulaire ci-dessous et nous vous répondrons rapidement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-getigne-800">
                          Prénom <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          id="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="border-getigne-200 focus:border-getigne-green-500 focus:ring-getigne-green-500"
                          placeholder="Votre prénom"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-getigne-800">
                          Nom <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          id="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="border-getigne-200 focus:border-getigne-green-500 focus:ring-getigne-green-500"
                          placeholder="Votre nom"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-getigne-800">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="border-getigne-200 focus:border-getigne-green-500 focus:ring-getigne-green-500"
                        placeholder="votre.email@exemple.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-getigne-800">
                        Sujet
                      </Label>
                      <Input
                        type="text"
                        id="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="border-getigne-200 focus:border-getigne-green-500 focus:ring-getigne-green-500"
                        placeholder="Objet de votre message"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-getigne-800">
                        Message <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        className="border-getigne-200 focus:border-getigne-green-500 focus:ring-getigne-green-500 resize-none"
                        placeholder="Décrivez votre demande, question ou suggestion..."
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-getigne-green-500 hover:bg-getigne-green-600 text-white py-3 text-base font-medium transition-all duration-200 transform hover:scale-[1.02]"
                      disabled={isSubmitting}
                    >
                      <Send className="mr-2 h-4 w-4" /> 
                      {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ContactPage;

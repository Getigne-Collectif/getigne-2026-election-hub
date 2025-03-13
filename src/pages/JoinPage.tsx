
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Users, Heart, Zap, Landmark, LayoutList, PiggyBank, Home, Send } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";

const JoinPage = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Check if URL has #contact hash
    if (location.hash === '#contact') {
      setTimeout(() => {
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
          contactForm.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }, [location]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Here you would typically send the form data to your backend
    // For now, we'll just simulate a successful submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Message envoyé !",
        description: "Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.",
      });
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        subject: '',
        message: ''
      });
    }, 1000);
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>Rejoignez le mouvement | Gétigné Collectif</title>
        <meta
          name="description"
          content="Rejoignez notre collectif citoyen et participez activement à la vie démocratique de Gétigné."
        />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Navbar />

        <div className="pt-24 pb-12 bg-getigne-50">
          <div className="container mx-auto px-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">
                    <Home className="h-4 w-4 mr-1" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Rejoignez le mouvement</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="max-w-3xl mx-auto text-center mt-4">
              <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                Participez
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Rejoignez le mouvement</h1>
              <p className="text-getigne-700 text-lg mb-8">
                Ensemble, agissons pour notre commune et construisons une démocratie plus participative.
              </p>
            </div>
          </div>
        </div>

        <main className="flex-grow">
          <section className="relative py-16 md:py-24 px-4 bg-getigne-50">
            <div className="container mx-auto">
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="md:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm p-8 md:p-10 h-full">
                    <div className="grid md:grid-cols-2 gap-10">
                      <div>
                        <h2 className="text-2xl font-semibold mb-4">Pourquoi adhérer ?</h2>
                        <ul className="space-y-6">
                          <li className="flex gap-4">
                            <div className="mt-1 w-10 h-10 bg-getigne-accent/10 rounded-full flex-shrink-0 flex items-center justify-center">
                              <Users className="text-getigne-accent h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-xl font-medium">Faire partie d'un collectif</h3>
                              <p className="text-getigne-700">Rejoignez un groupe de citoyens engagés pour le bien commun et l'avenir de notre territoire.</p>
                            </div>
                          </li>
                          <li className="flex gap-4">
                            <div className="mt-1 w-10 h-10 bg-getigne-accent/10 rounded-full flex-shrink-0 flex items-center justify-center">
                              <Zap className="text-getigne-accent h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-xl font-medium">Participer aux décisions</h3>
                              <p className="text-getigne-700">Votez lors des assemblées générales et contribuez aux orientations du collectif.</p>
                            </div>
                          </li>
                          <li className="flex gap-4">
                            <div className="mt-1 w-10 h-10 bg-getigne-accent/10 rounded-full flex-shrink-0 flex items-center justify-center">
                              <LayoutList className="text-getigne-accent h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-xl font-medium">Accéder à nos événements</h3>
                              <p className="text-getigne-700">Participez à nos rencontres, formations et ateliers, dont certains sont réservés à nos adhérents.</p>
                            </div>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h2 className="text-2xl font-semibold mb-4">Notre organisation</h2>
                        <ul className="space-y-6">
                          <li className="flex gap-4">
                            <div className="mt-1 w-10 h-10 bg-getigne-accent/10 rounded-full flex-shrink-0 flex items-center justify-center">
                              <Landmark className="text-getigne-accent h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-xl font-medium">Association loi 1901</h3>
                              <p className="text-getigne-700">Notre collectif est constitué en association à but non lucratif, dirigée par un bureau élu.</p>
                            </div>
                          </li>
                          <li className="flex gap-4">
                            <div className="mt-1 w-10 h-10 bg-getigne-accent/10 rounded-full flex-shrink-0 flex items-center justify-center">
                              <PiggyBank className="text-getigne-accent h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-xl font-medium">Financement transparent</h3>
                              <p className="text-getigne-700">Nos ressources proviennent uniquement des cotisations et dons de nos membres et sympathisants.</p>
                            </div>
                          </li>
                          <li className="flex gap-4">
                            <div className="mt-1 w-10 h-10 bg-getigne-accent/10 rounded-full flex-shrink-0 flex items-center justify-center">
                              <Heart className="text-getigne-accent h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-xl font-medium">Engagement bénévole</h3>
                              <p className="text-getigne-700">Tous nos membres agissent bénévolement, par conviction et attachement à notre commune.</p>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-getigne-100 pt-10 mt-10">
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Comment nous rejoindre ?</h2>
                        <p className="text-getigne-700 max-w-2xl mx-auto">
                          L'adhésion annuelle est à <strong>prix libre</strong> pour que chaque personne puisse donner selon ses moyens et définir elle-même le bon montant. Vous pouvez également faire un don libre pour soutenir nos actions.
                        </p>
                      </div>

                      <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8">
                        <Button
                          size="lg"
                          className="bg-getigne-accent hover:bg-getigne-accent/90 text-white"
                          onClick={() => window.open('https://www.helloasso.com/associations/getigne-collectif/adhesions/adhesion-2025', '_blank')}
                        >
                          Adhérer en ligne
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          className="border-getigne-accent text-getigne-accent hover:bg-getigne-accent/5"
                          onClick={() => window.open('https://www.helloasso.com/associations/getigne-collectif/adhesions/adhesion-2025', '_blank')}
                        >
                          Faire un don
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl overflow-hidden shadow-sm h-[300px]">
                    <img
                      src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                      alt="Groupe de discussion"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="rounded-xl overflow-hidden shadow-sm h-[300px]">
                    <img
                      src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                      alt="Réunion de collectif"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Form Section */}
          <section id="contact-form" className="py-16 px-4 bg-white">
            <div className="container mx-auto">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                  Contact
                </span>
                <h2 className="text-3xl font-bold mt-4 mb-6">Contactez-nous</h2>
                <p className="text-getigne-700">
                  Vous avez des questions ou des suggestions ? N'hésitez pas à nous contacter.
                </p>
              </div>

              <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-getigne-800 mb-1">
                        Prénom
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-getigne-200 rounded-md focus:outline-none focus:ring-2 focus:ring-getigne-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-getigne-800 mb-1">
                        Nom
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-getigne-200 rounded-md focus:outline-none focus:ring-2 focus:ring-getigne-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-getigne-800 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
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
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-getigne-200 rounded-md focus:outline-none focus:ring-2 focus:ring-getigne-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-getigne-800 mb-1">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-getigne-200 rounded-md focus:outline-none focus:ring-2 focus:ring-getigne-green-500"
                      required
                    ></textarea>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    disabled={isSubmitting}
                  >
                    <Send className="mr-2 h-4 w-4" /> 
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
                  </Button>
                </form>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default JoinPage;

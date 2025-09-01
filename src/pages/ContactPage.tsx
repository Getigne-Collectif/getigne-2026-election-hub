
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Heart } from 'lucide-react';
import ContactForm from '@/components/ContactForm';

const ContactPage = () => {

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
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-getigne-900">
            Contactez-nous
          </h1>
          <p className="text-lg md:text-xl text-getigne-700 max-w-3xl mx-auto leading-relaxed">
            <span className="hidden md:inline">Vous avez des questions, des suggestions ou souhaitez rejoindre notre collectif ? Nous sommes là pour vous écouter et vous accompagner.</span>
            <span className="md:hidden">Questions, suggestions ou envie de nous rejoindre ? Nous sommes là pour vous.</span>
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            
            {/* Informations de contact */}
            <div className="lg:col-span-1 space-y-6 hidden lg:block">
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
            <div className="lg:col-span-2 lg:col-start-2">

            <div className="flex flex-col items-center justify-center mb-8">
              <h2 className="text-center text-xl md:text-2xl text-getigne-900 font-bold">Envoyez-nous un message</h2>
              <div className="text-sm md:text-base">
                <span className="hidden md:inline">Remplissez le formulaire ci-dessous et nous vous répondrons rapidement</span>
                <span className="md:hidden">Remplissez le formulaire et nous vous répondrons rapidement</span>
              </div>
            </div>
              <Card className="border-getigne-200 shadow-sm">
                <CardHeader className="text-center p-4 md:p-6">
                  <CardTitle >
                    
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <ContactForm />
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

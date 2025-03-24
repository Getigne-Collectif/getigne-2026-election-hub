
import { useEffect } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  BrainCircuit, 
  ShieldCheck, 
  Heart, 
  Users, 
  Leaf, 
  Calendar, 
  PenTool 
} from 'lucide-react';

const ObjectifPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <HelmetProvider>
      <Helmet>
        <title>Objectif 2026 | Gétigné Collectif</title>
        <meta
          name="description"
          content="Notre projet pour les élections municipales de 2026 à Gétigné : une commune plus écologique, solidaire et démocratique."
        />
      </Helmet>

      <div className="page-content">
        <Navbar />
        
        <div className="pt-24 bg-getigne-50">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                Élections municipales 2026
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Objectif 2026</h1>
              <p className="text-getigne-700 text-lg">
                Ensemble, construisons une commune plus écologique, solidaire et démocratique pour les élections municipales de 2026.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-16">
              <div className="grid md:grid-cols-2">
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <h2 className="text-3xl font-bold mb-6 text-getigne-900">Vers un renouveau collectif</h2>
                  <p className="text-getigne-700 mb-6">
                    Depuis mai 2024, le collectif s'est engagé dans une démarche ambitieuse : 
                    élaborer un programme qui répond aux défis de notre commune pour les prochaines années.
                  </p>
                  <p className="text-getigne-700 mb-6">
                    Nous sommes convaincus que Gétigné a besoin d'un souffle nouveau, d'idées innovantes 
                    et d'une équipe dynamique pour construire un avenir plus durable, plus solidaire et plus participatif.
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <Button asChild className="bg-getigne-accent hover:bg-getigne-accent/90">
                      <Link to="/objectif-2026/commissions">Découvrir nos commissions</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/adherer">Rejoindre le collectif</Link>
                    </Button>
                  </div>
                </div>
                <div className="h-64 md:h-auto bg-getigne-100">
                  <img 
                    src="/lovable-uploads/07e7372b-7c2e-4584-9a92-9becd5096172.png" 
                    alt="Réunion du collectif" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Vision et méthode */}
            <div className="mb-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">Notre vision et notre méthode</h2>
                <p className="text-getigne-700 mt-3 max-w-2xl mx-auto">
                  Une approche différente, participative et transparente pour construire ensemble la commune de demain.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <BrainCircuit className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Intelligence collective</h3>
                  <p className="text-getigne-700">
                    Nous croyons au pouvoir des idées partagées et de la co-construction. 
                    Chaque citoyen a une expertise à apporter au projet collectif.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <ShieldCheck className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Engagement responsable</h3>
                  <p className="text-getigne-700">
                    Nous nous engageons à mener une politique transparente et responsable, 
                    avec une vision à long terme pour notre commune.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <Heart className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Solidarité renforcée</h3>
                  <p className="text-getigne-700">
                    Une commune qui n'oublie personne et qui crée du lien entre tous les habitants, 
                    quels que soient leur âge ou leur situation.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <Users className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Démocratie participative</h3>
                  <p className="text-getigne-700">
                    Les citoyens au cœur de la prise de décision, avec des consultations régulières 
                    et des outils innovants de participation citoyenne.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <Leaf className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Transition écologique</h3>
                  <p className="text-getigne-700">
                    Des actions concrètes pour une commune plus verte, plus durable, 
                    qui préserve son patrimoine naturel et prépare l'avenir.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <PenTool className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Créativité locale</h3>
                  <p className="text-getigne-700">
                    Valoriser et dynamiser notre territoire par la culture, l'innovation 
                    et l'accompagnement des initiatives locales.
                  </p>
                </div>
              </div>
            </div>

            {/* Engagez-vous section */}
            <div className="bg-getigne-accent/5 rounded-xl p-8 md:p-12 mb-16">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-6">Engagez-vous dans la campagne !</h2>
                  <p className="text-getigne-700 mb-6">
                    Rejoignez notre équipe "Animation" et participez à l'organisation d'événements 
                    pour faire découvrir notre projet aux habitants de Gétigné.
                  </p>
                  <p className="text-getigne-700 mb-6">
                    Que vous soyez disponible ponctuellement ou régulièrement, nous avons besoin 
                    de votre énergie et de vos idées pour faire vivre cette campagne !
                  </p>
                  <div className="flex space-x-4 mt-4">
                    <Button asChild>
                      <Link to="/adherer">Devenir bénévole</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/contact">Nous contacter</Link>
                    </Button>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="bg-white p-6 rounded-xl shadow-md grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-getigne-accent" />
                        <span>Organiser</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Users className="text-getigne-accent" />
                        <span>Mobiliser</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <PenTool className="text-getigne-accent" />
                        <span>Créer</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Heart className="text-getigne-accent" />
                        <span>Partager</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Photos grid */}
            <div className="mb-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">Un collectif en action</h2>
                <p className="text-getigne-700 mt-3 max-w-2xl mx-auto">
                  Découvrez nos activités et nos rencontres avec les citoyens de Gétigné.
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="relative rounded-lg overflow-hidden h-48 col-span-2">
                  <img 
                    src="/lovable-uploads/07e7372b-7c2e-4584-9a92-9becd5096172.png" 
                    alt="Réunion du collectif" 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="relative rounded-lg overflow-hidden h-48">
                  <img 
                    src="/lovable-uploads/07e7372b-7c2e-4584-9a92-9becd5096172.png" 
                    alt="Atelier participatif" 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="relative rounded-lg overflow-hidden h-48">
                  <img 
                    src="/lovable-uploads/07e7372b-7c2e-4584-9a92-9becd5096172.png" 
                    alt="Réunion publique" 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="relative rounded-lg overflow-hidden h-48">
                  <img 
                    src="/lovable-uploads/07e7372b-7c2e-4584-9a92-9becd5096172.png" 
                    alt="Visite de terrain" 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="relative rounded-lg overflow-hidden h-48 col-span-2">
                  <img 
                    src="/lovable-uploads/07e7372b-7c2e-4584-9a92-9becd5096172.png" 
                    alt="Stand marché" 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default ObjectifPage;

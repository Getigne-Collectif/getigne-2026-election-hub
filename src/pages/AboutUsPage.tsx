
import { useEffect } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  Lightbulb,
  Target,
  HandshakeIcon,
  Heart
} from 'lucide-react';

const AboutUsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <HelmetProvider>
      <Helmet>
        <title>Qui sommes-nous ? | Gétigné Collectif</title>
        <meta
          name="description"
          content="Découvrez qui nous sommes, notre histoire, nos valeurs et notre vision pour la commune de Gétigné."
        />
      </Helmet>

      <div className="page-content">
        <Navbar />

        <div className="pt-24 bg-getigne-50">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                Notre histoire
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Qui sommes-nous ?</h1>
              <p className="text-getigne-700 text-lg">
                Un collectif citoyen engagé pour une commune plus écologique, solidaire et démocratique.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-16">
              <div className="grid md:grid-cols-2">
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <h2 className="text-3xl font-bold mb-6 text-getigne-900">Notre histoire</h2>
                  <p className="text-getigne-700 mb-4">
                    Gétigné Collectif est né en 2020 d'une volonté commune de proposer une alternative
                    pour la gestion de notre commune, fondée sur la participation citoyenne,
                    la transparence et l'intérêt général.
                  </p>
                  <p className="text-getigne-700 mb-4">
                    Depuis, notre collectif s'est structuré et enrichi de nouvelles compétences.
                    Nous sommes aujourd'hui un groupe diversifié de citoyens engagés, aux parcours
                    et expertises variés, unis par la même vision pour Gétigné.
                  </p>
                </div>
                <div className="h-64 md:h-auto bg-getigne-100">
                  <img
                    src="/placeholder.svg"
                    alt="Réunion du collectif"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Nos valeurs */}
            <div className="mb-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">Nos valeurs</h2>
                <p className="text-getigne-700 mt-3 max-w-2xl mx-auto">
                  Les principes qui guident notre action collective au quotidien.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <Lightbulb className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Innovation</h3>
                  <p className="text-getigne-700">
                    Nous croyons à l'innovation comme levier de transformation de notre commune,
                    en explorant de nouvelles idées pour répondre aux défis d'aujourd'hui et de demain.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <Users className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Inclusion</h3>
                  <p className="text-getigne-700">
                    Nous sommes attachés à une commune qui n'oublie personne, où chacun peut
                    trouver sa place et contribuer à la vie locale selon ses moyens et ses capacités.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <Target className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Transparence</h3>
                  <p className="text-getigne-700">
                    Nous défendons une gestion transparente des affaires publiques, où les
                    décisions sont expliquées et où les citoyens ont accès à l'information.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <Heart className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Solidarité</h3>
                  <p className="text-getigne-700">
                    Nous promouvons l'entraide et le soutien mutuel comme fondements
                    d'une communauté résiliente face aux défis sociaux et environnementaux.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <HandshakeIcon className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Coopération</h3>
                  <p className="text-getigne-700">
                    Nous privilégions la coopération plutôt que la compétition, en favorisant
                    les partenariats et les projets collectifs pour le bien commun.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <Calendar className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Durabilité</h3>
                  <p className="text-getigne-700">
                    Nous intégrons systématiquement les enjeux environnementaux dans nos réflexions,
                    pour préserver notre cadre de vie et préparer un avenir durable.
                  </p>
                </div>
              </div>
            </div>

            {/* Notre vision */}
            <div className="bg-getigne-accent/5 rounded-xl p-8 md:p-12 mb-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">Notre vision pour Gétigné</h2>
                <p className="text-getigne-700 mt-3 max-w-2xl mx-auto">
                  Nous imaginons une commune...
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">Écologique</h3>
                  <p className="text-getigne-700">
                    Qui préserve son patrimoine naturel, développe les mobilités douces,
                    favorise les circuits courts et prépare la transition énergétique.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">Solidaire</h3>
                  <p className="text-getigne-700">
                    Où l'entraide est valorisée, où les services publics sont accessibles à tous,
                    et où la vie associative est dynamique et soutenue.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">Participative</h3>
                  <p className="text-getigne-700">
                    Qui implique réellement ses habitants dans les décisions, avec des espaces
                    de dialogue, des budgets participatifs et des consultations régulières.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="text-xl font-semibold mb-3">Innovante</h3>
                  <p className="text-getigne-700">
                    Qui encourage les initiatives locales, soutient l'économie sociale et solidaire,
                    et développe des solutions créatives pour répondre aux besoins des habitants.
                  </p>
                </div>
              </div>

              <div className="text-center mt-8">
                <Button asChild className="bg-getigne-accent hover:bg-getigne-accent/90">
                  <Link to="/objectif-2026">Découvrir notre projet pour 2026</Link>
                </Button>
              </div>
            </div>

            {/* Rejoignez-nous */}
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-6">Rejoignez le collectif</h2>
              <p className="text-getigne-700 mb-8 max-w-2xl mx-auto">
                Vous partagez nos valeurs et notre vision pour Gétigné ?
                Rejoignez-nous et participez à la construction d'une commune où il fait bon vivre, ensemble.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Button asChild>
                  <Link to="/adherer">Devenir membre</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/contact">Nous contacter</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default AboutUsPage;

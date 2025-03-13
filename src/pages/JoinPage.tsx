
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import Breadcrumb from "@/components/Breadcrumb";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Users, Heart, Zap, Landmark, LayoutList, PiggyBank } from 'lucide-react';

const JoinPage = () => {
  return (
    <HelmetProvider>
      <Helmet>
        <title>Adhérer | Gétigné Collectif</title>
        <meta
          name="description"
          content="Rejoignez notre collectif citoyen et participez activement à la vie démocratique de Gétigné."
        />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Navbar />
        <Breadcrumb />

        <main className="flex-grow">
          <section className="relative py-16 md:py-24 px-4 bg-getigne-50">
            <div className="container mx-auto">
              <div className="text-center mb-12 max-w-3xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold mb-6">
                  Rejoignez Gétigné Collectif
                </h1>
                <p className="text-lg text-getigne-700">
                  Ensemble, agissons pour notre commune et construisons une démocratie plus participative.
                </p>
              </div>
              
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
                          L'adhésion annuelle est de 10€. Vous pouvez également faire un don libre pour soutenir nos actions.
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
        </main>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default JoinPage;

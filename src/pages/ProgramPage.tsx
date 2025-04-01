
import { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home, LockKeyhole } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';

const ProgramPage = () => {
  const { user, userRoles, authChecked } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { settings, loading: loadingSettings } = useAppSettings();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (userRoles.includes('admin') || userRoles.includes('program_manager')) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      if (user) {
        toast({
          variant: "destructive",
          title: "Accès restreint",
          description: "Vous n'avez pas les droits nécessaires pour accéder à cette page."
        });
      }
    }
    setIsChecking(false);
  }, [user, userRoles, authChecked, toast]);

  // Si les paramètres sont activés et que le programme est visible, on montre le programme à tous
  const showProgramToAll = settings.showProgram;

  if (loadingSettings || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Vérification des droits d'accès...</p>
        </div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Programme | Gétigné Collectif</title>
        <meta
          name="description"
          content="Le programme de Gétigné Collectif pour les élections municipales de 2026."
        />
      </Helmet>

      <div className="page-content">
        <Navbar />

        <div className="pt-24 pb-12 bg-getigne-50">
          <div className="container mx-auto px-4">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">
                    <Home className="h-4 w-4 mr-1" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/objectif-2026">
                    Objectif 2026
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Programme</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="max-w-3xl mx-auto text-center">
              <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                Élections 2026
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Notre programme</h1>
            </div>
          </div>
        </div>

        <div className="py-16">
          <div className="container mx-auto px-4">
            {showProgramToAll || isAuthorized ? (
              // Contenu visible pour les utilisateurs autorisés ou si showProgram est activé
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-getigne-100 p-8 mb-8">
                  <h2 className="text-2xl font-bold mb-4">En construction</h2>
                  <p className="mb-4">
                    Le programme de Gétigné Collectif pour les élections municipales de 2026 est actuellement
                    en cours d'élaboration par nos commissions thématiques.
                  </p>
                  <p className="mb-4">
                    Depuis mai 2024, nos commissions travaillent sur différentes thématiques pour construire
                    un programme ambitieux et réaliste pour l'avenir de notre commune.
                  </p>
                  <p>
                    Cette page sera mise à jour régulièrement pour partager l'avancement de nos travaux.
                  </p>
                </div>

                {/* Contenu du programme - Section vide pour le moment */}
                <div className="space-y-8">
                  <div className="bg-white rounded-xl shadow-sm border border-getigne-100 p-8">
                    <h2 className="text-2xl font-bold mb-4">Calendrier d'élaboration</h2>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="bg-getigne-accent/10 text-getigne-accent font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 mt-1">1</div>
                        <div className="ml-4">
                          <h3 className="font-medium">Mai - Août 2024</h3>
                          <p className="text-getigne-700">Constitution des commissions thématiques et premières réunions de travail</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-getigne-accent/10 text-getigne-accent font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 mt-1">2</div>
                        <div className="ml-4">
                          <h3 className="font-medium">Septembre - Décembre 2024</h3>
                          <p className="text-getigne-700">Élaboration des propositions prioritaires et consultations citoyennes</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-getigne-accent/10 text-getigne-accent font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 mt-1">3</div>
                        <div className="ml-4">
                          <h3 className="font-medium">Janvier - Avril 2025</h3>
                          <p className="text-getigne-700">Création du site web + élaboration d'une première version "brute" du programme</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-getigne-accent/10 text-getigne-accent font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 mt-1">4</div>
                        <div className="ml-4">
                          <h3 className="font-medium">Avril 2025</h3>
                          <p className="text-getigne-700">Lancement publique du mouvement</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-getigne-accent/10 text-getigne-accent font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 mt-1">5</div>
                        <div className="ml-4">
                          <h3 className="font-medium">Mai - Septembre 2025</h3>
                          <p className="text-getigne-700">Rencontres des citoyens et acteurs locaux, ateliers participatifs et maturation du programme</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-getigne-accent/10 text-getigne-accent font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 mt-1">6</div>
                        <div className="ml-4">
                          <h3 className="font-medium">Septembre - Décembre 2025</h3>
                          <p className="text-getigne-700">Présentations publiques des piliers du programme</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Page d'accès restreint pour les autres utilisateurs
              <div className="max-w-xl mx-auto text-center">
                <div className="bg-white rounded-xl shadow-sm border border-getigne-100 p-8">
                  <div className="flex justify-center mb-6">
                    <div className="bg-getigne-100 rounded-full p-4">
                      <LockKeyhole size={48} className="text-getigne-700" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Accès restreint</h2>
                  <p className="text-getigne-700 mb-6">
                    Cette page est réservée aux membres de l'équipe Programme.
                    Notre programme est actuellement en cours d'élaboration et
                    sera rendu public prochainement.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild>
                      <Link to="/objectif-2026">Découvrir notre projet</Link>
                    </Button>
                    {!user && (
                      <Button asChild variant="outline">
                        <Link to="/auth">Se connecter</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default ProgramPage;

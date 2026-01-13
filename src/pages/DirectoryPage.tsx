import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useAuth } from '@/context/auth';
import { useToast } from '@/components/ui/use-toast';
import { BookUser, Users, Building2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import InternalContactsList from '@/components/directory/InternalContactsList';
import ExternalContactsPlaceholder from '@/components/directory/ExternalContactsPlaceholder';
import { Routes } from '@/routes';
import { cn } from '@/lib/utils';

const DirectoryPage = () => {
  const { isAdmin, authChecked, isRefreshingRoles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Déterminer l'onglet actif depuis l'URL
  const activeTab = location.pathname === Routes.DIRECTORY_EXTERNAL ? 'external' : 'internal';

  useEffect(() => {
    if (!authChecked) return;
    if (isRefreshingRoles) return;

    if (!isAdmin) {
      navigate('/');
      toast({
        title: 'Accès refusé',
        description: "Vous n'avez pas les droits pour accéder à cette page.",
        variant: 'destructive',
      });
      return;
    }

    // Rediriger vers /annuaire/internes si on est sur /annuaire
    if (location.pathname === Routes.DIRECTORY) {
      navigate(Routes.DIRECTORY_INTERNAL, { replace: true });
    }
  }, [authChecked, isAdmin, navigate, toast, isRefreshingRoles, location.pathname]);

  // Ne rien afficher tant qu'on n'a pas vérifié l'authentification
  if (!authChecked || isRefreshingRoles) {
    return null;
  }

  // Ne rien afficher si pas admin
  if (!isAdmin) {
    return null;
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Annuaire | Gétigné Collectif</title>
        <meta name="description" content="Annuaire des contacts internes et externes du collectif" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-getigne-50/30">
        <Navbar />
        
        <main className="flex-1 pt-24 pb-12">
          <div className="container mx-auto px-4">
            {/* En-tête */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-lg bg-getigne-100 p-2.5">
                  <BookUser className="h-6 w-6 text-getigne-600" />
                </div>
                <h1 className="text-3xl font-bold text-getigne-900">Annuaire</h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-3xl">
                Retrouvez tous les contacts du collectif. Exportez les coordonnées au format vCard 
                pour les intégrer dans votre carnet d'adresses.
              </p>
            </div>

            {/* Onglets avec navigation par URL */}
            <div className="space-y-6">
              <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                <Link
                  to={Routes.DIRECTORY_INTERNAL}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    activeTab === 'internal' && "bg-background text-foreground shadow-sm"
                  )}
                >
                  <Users className="h-4 w-4 mr-2" />
                  <span>Contacts Internes</span>
                </Link>
                <Link
                  to={Routes.DIRECTORY_EXTERNAL}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    activeTab === 'external' && "bg-background text-foreground shadow-sm"
                  )}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  <span>Contacts Externes</span>
                </Link>
              </div>

              <div className="mt-6">
                {activeTab === 'internal' ? (
                  <InternalContactsList />
                ) : (
                  <ExternalContactsPlaceholder />
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default DirectoryPage;

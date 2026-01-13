import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useAuth } from '@/context/auth';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookUser, Users, Building2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import InternalContactsList from '@/components/directory/InternalContactsList';
import ExternalContactsPlaceholder from '@/components/directory/ExternalContactsPlaceholder';

const DirectoryPage = () => {
  const { isAdmin, authChecked, isRefreshingRoles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
  }, [authChecked, isAdmin, navigate, toast, isRefreshingRoles]);

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

            {/* Onglets */}
            <Tabs defaultValue="internal" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="internal" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Contacts Internes</span>
                </TabsTrigger>
                <TabsTrigger value="external" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Contacts Externes</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    Bientôt
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="internal" className="space-y-6">
                <InternalContactsList />
              </TabsContent>

              <TabsContent value="external" className="space-y-6">
                <ExternalContactsPlaceholder />
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default DirectoryPage;

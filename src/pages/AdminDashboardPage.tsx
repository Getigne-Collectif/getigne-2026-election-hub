
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Users, Newspaper, Calendar, Settings, TrendingUp, Eye, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminDashboardPage = () => {
  const { user, isAdmin, authChecked } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [metrics, setMetrics] = useState({
    users: 0,
    news: 0,
    events: 0,
    pageViews: 0,
    comments: 0
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (user && isAdmin) {
      setIsAuthorized(true);
      fetchMetrics();
    } else {
      setIsAuthorized(false);
      if (user) {
        toast({
          variant: "destructive",
          title: "Accès restreint",
          description: "Vous n'avez pas les droits nécessaires pour accéder à cette page."
        });
        navigate('/');
      } else {
        navigate('/auth');
      }
    }
    setIsChecking(false);
  }, [user, isAdmin, authChecked, navigate, toast]);

  const fetchMetrics = async () => {
    try {
      // Utilisateurs
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Actualités
      const { count: newsCount, error: newsError } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true });

      // Événements
      const { count: eventsCount, error: eventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Commentaires
      const { count: commentsCount, error: commentsError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true });

      if (usersError || newsError || eventsError || commentsError) {
        console.error("Erreur lors de la récupération des métriques:", { usersError, newsError, eventsError, commentsError });
      } else {
        setMetrics({
          users: usersCount || 0,
          news: newsCount || 0,
          events: eventsCount || 0,
          pageViews: Math.floor(Math.random() * 1000), // Simulated for demo
          comments: commentsCount || 0
        });
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des métriques:", error);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Vérification des droits d'accès...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const adminLinks = [
    { title: "Utilisateurs", icon: <Users className="h-5 w-5" />, url: "/admin/users" },
    { title: "Actualités", icon: <Newspaper className="h-5 w-5" />, url: "/admin/news" },
    { title: "Événements", icon: <Calendar className="h-5 w-5" />, url: "/admin/events" },
    { title: "Paramètres", icon: <Settings className="h-5 w-5" />, url: "/admin/settings" }
  ];

  return (
    <HelmetProvider>
      <Helmet>
        <title>Tableau de bord | Administration | Gétigné Collectif</title>
        <meta
          name="description"
          content="Tableau de bord d'administration du site Gétigné Collectif."
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
                  <BreadcrumbPage>Administration</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            
            <div className="max-w-3xl mx-auto text-center">
              <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                Administration
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Tableau de bord</h1>
              <p className="text-getigne-700 text-lg mb-6">
                Bienvenue dans l'espace d'administration du site Gétigné Collectif.
              </p>
            </div>
          </div>
        </div>

        <div className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center">
                    <Users className="h-5 w-5 mr-2 text-getigne-accent" />
                    Utilisateurs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metrics.users}</div>
                  <CardDescription>utilisateurs inscrits</CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center">
                    <Newspaper className="h-5 w-5 mr-2 text-getigne-accent" />
                    Actualités
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metrics.news}</div>
                  <CardDescription>articles publiés</CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-getigne-accent" />
                    Événements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metrics.events}</div>
                  <CardDescription>événements créés</CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-getigne-accent" />
                    Commentaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metrics.comments}</div>
                  <CardDescription>commentaires publiés</CardDescription>
                </CardContent>
              </Card>
            </div>

            <h2 className="text-2xl font-bold mb-6">Gestion du site</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {adminLinks.map((link) => (
                <Card key={link.title} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <Button 
                      variant="ghost" 
                      className="w-full h-full flex flex-col items-center justify-center p-6 space-y-3"
                      asChild
                    >
                      <Link to={link.url}>
                        <div className="bg-getigne-50 p-3 rounded-full">
                          {link.icon}
                        </div>
                        <span className="font-medium">{link.title}</span>
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6">Navigation rapide</h2>
              <Tabs defaultValue="users">
                <TabsList className="mb-6">
                  <TabsTrigger value="users">Utilisateurs</TabsTrigger>
                  <TabsTrigger value="news">Actualités</TabsTrigger>
                  <TabsTrigger value="events">Événements</TabsTrigger>
                  <TabsTrigger value="settings">Paramètres</TabsTrigger>
                </TabsList>
                <TabsContent value="users" className="border rounded-lg p-6">
                  <h3 className="text-xl font-medium mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Gestion des utilisateurs
                  </h3>
                  <p className="mb-4">
                    Gérez les utilisateurs, attribuez des rôles et envoyez des invitations.
                  </p>
                  <Button asChild>
                    <Link to="/admin/users">Gérer les utilisateurs</Link>
                  </Button>
                </TabsContent>
                <TabsContent value="news" className="border rounded-lg p-6">
                  <h3 className="text-xl font-medium mb-4 flex items-center">
                    <Newspaper className="h-5 w-5 mr-2" />
                    Gestion des actualités
                  </h3>
                  <p className="mb-4">
                    Créez, modifiez et supprimez des articles d'actualité.
                  </p>
                  <div className="flex space-x-4">
                    <Button asChild>
                      <Link to="/admin/news">Gérer les actualités</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/admin/news/new">Créer un nouvel article</Link>
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="events" className="border rounded-lg p-6">
                  <h3 className="text-xl font-medium mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Gestion des événements
                  </h3>
                  <p className="mb-4">
                    Créez, modifiez et supprimez des événements de l'agenda.
                  </p>
                  <div className="flex space-x-4">
                    <Button asChild>
                      <Link to="/admin/events">Gérer les événements</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/admin/events/new">Créer un nouvel événement</Link>
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="settings" className="border rounded-lg p-6">
                  <h3 className="text-xl font-medium mb-4 flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Paramètres du site
                  </h3>
                  <p className="mb-4">
                    Configurez les paramètres généraux du site.
                  </p>
                  <Button asChild>
                    <Link to="/admin/settings">Gérer les paramètres</Link>
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default AdminDashboardPage;

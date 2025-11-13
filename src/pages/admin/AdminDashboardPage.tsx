import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { useAuth } from '@/context/AuthContext.tsx';
import { useToast } from '@/components/ui/use-toast.ts';
import { supabase } from '@/integrations/supabase/client.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import {
  Users,
  Newspaper,
  Calendar,
  MessageSquare,
  Component,
  File,
  Star,
  MenuIcon,
  UserCircle,
  Tags,
  ListChecks
} from 'lucide-react';
import AdminLayout from "@/components/admin/AdminLayout.tsx";
import {GearIcon} from "@radix-ui/react-icons";
import { Routes } from '@/routes';

const AdminDashboardPage = () => {
  const { user, isAdmin, authChecked, isRefreshingRoles } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [metrics, setMetrics] = useState({
    users: 0,
    news: 0,
    events: 0,
    pages: 0,
    projects: 0,
    committees: 0,
    programPoints: 0,
    comments: 0
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (isRefreshingRoles) return;

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
  }, [user, isAdmin, authChecked, navigate, toast, isRefreshingRoles]);

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

      // Pages
      const { count: pagesCount, error: pagesError } = await supabase
        .from('pages')
        .select('*', { count: 'exact', head: true });

      // Commentaires
      const { count: commentsCount, error: commentsError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true });

      // Commissions
      const { count: citizen_committeesCount, error: citizen_committeesError } = await supabase
        .from('citizen_committees')
        .select('*', { count: 'exact', head: true });


      // Program
      const { count: programPointsCount, error: programPointsError } = await supabase
        .from('program_points')
        .select('*', { count: 'exact', head: true });

      // Projets
      const { count: projectsCount, error: projectsError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      if (usersError || newsError || eventsError || commentsError) {
        console.error("Erreur lors de la récupération des métriques:", { usersError, newsError, eventsError, commentsError });
      } else {
        setMetrics({
          users: usersCount || 0,
          news: newsCount || 0,
          events: eventsCount || 0,
          pages: pagesCount || 0,
          projects: projectsCount || 0,
          committees: citizen_committeesCount || 0,
          programPoints: programPointsCount || 0,
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

  return (
      <HelmetProvider>
        <Helmet>
          <title>Tableau de bord | Administration | Gétigné Collectif</title>
          <meta
              name="description"
              content="Tableau de bord d'administration du site Gétigné Collectif."
          />
        </Helmet>

        <AdminLayout title="Tableau de bord" description="Bienvenue dans l'espace d'administration du site Gétigné Collectif.">
          <div className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">

              <Link to={Routes.ADMIN_USERS}>
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
              </Link>

              <Link to={Routes.ADMIN_NEWS}>
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
              </Link>

              <Link to={Routes.ADMIN_EVENTS}>
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
              </Link>

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

              <Link to={Routes.ADMIN_PAGES}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex items-center">
                      <File className="h-5 w-5 mr-2 text-getigne-accent" />
                      Pages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{metrics.pages}</div>
                    <CardDescription>pages créés</CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link to={Routes.ADMIN_PROJECTS}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex items-center">
                      <Star className="h-5 w-5 mr-2 text-getigne-accent" />
                      Projets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{metrics.projects}</div>
                    <CardDescription>projets créés</CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link to={Routes.ADMIN_COMMITTEES}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex items-center">
                      <Component className="h-5 w-5 mr-2 text-getigne-accent" />
                      Commissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{metrics.committees}</div>
                    <CardDescription>commissions créés</CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link to={Routes.ADMIN_PROGRAM}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex items-center">
                      <Component className="h-5 w-5 mr-2 text-getigne-accent" />
                      Programme
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{metrics.programPoints}</div>
                    <CardDescription>points de programme</CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link to={Routes.ADMIN_TEAM_MEMBERS}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex items-center">
                      <UserCircle className="h-5 w-5 mr-2 text-getigne-accent" />
                      Membres de l'équipe
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Gérer les membres du collectif</CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link to={Routes.ADMIN_THEMATIC_ROLES}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex items-center">
                      <Tags className="h-5 w-5 mr-2 text-getigne-accent" />
                      Rôles thématiques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Gérer les rôles thématiques</CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link to={Routes.ADMIN_ELECTORAL_LIST}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex items-center">
                      <ListChecks className="h-5 w-5 mr-2 text-getigne-accent" />
                      Liste électorale
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Composer la liste pour Mars 2026</CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link to={Routes.ADMIN_SETTINGS}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex items-center">
                      <GearIcon className="h-5 w-5 mr-2 text-getigne-accent" />
                      Paramètres
                    </CardTitle>
                  </CardHeader>
                  <CardContent>

                  </CardContent>
                </Card>
              </Link>

              <Link to={Routes.ADMIN_MENU}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex items-center">
                      <MenuIcon className="h-5 w-5 mr-2 text-getigne-accent" />
                      Menu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>

                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
        </AdminLayout>
    </HelmetProvider>
  );
};

export default AdminDashboardPage;

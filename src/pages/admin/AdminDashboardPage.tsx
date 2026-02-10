import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { useAuth } from '@/context/AuthContext.tsx';
import { useToast } from '@/components/ui/use-toast.ts';
import { supabase } from '@/integrations/supabase/client.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import {
  Users,
  MessageSquare,
  Calendar,
  TrendingUp,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  Clock
} from 'lucide-react';
import AdminLayout from "@/components/admin/AdminLayout.tsx";
import { Routes, generateRoutes } from '@/routes';
import { Comment, CommentStatus } from '@/types/comments.types';
import { usePostHog } from '@/hooks/usePostHog';

interface RecentUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  is_member: boolean;
  avatar_url?: string;
}

interface RecentComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  status: CommentStatus;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  } | null;
  resource_type: 'news' | 'program';
  resource_title?: string;
  resource_slug?: string;
  program_item_id?: string;
  news_id?: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  event_type?: string;
  slug?: string;
}

interface TopPage {
  url: string;
  views: number;
  uniqueViews: number;
  avgTimeOnPage?: number;
}

interface PostHogStats {
  uniqueVisitors: number;
  pageViews: number;
  events: number;
  topPages: TopPage[];
  trend: {
    visitors: number;
    pageViews: number;
    events: number;
  };
}

const AdminDashboardPage = () => {
  const { user, isAdmin, authChecked, isRefreshingRoles } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentComments, setRecentComments] = useState<RecentComment[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
  const [postHogStats, setPostHogStats] = useState<PostHogStats | null>(null);
  const [postHogPeriod, setPostHogPeriod] = useState<string>('7days');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { posthog } = usePostHog();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (isRefreshingRoles) return;

    if (user && isAdmin) {
      setIsAuthorized(true);
      fetchDashboardData();
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

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRecentUsers(),
        fetchRecentComments(),
        fetchUpcomingEvents(),
        fetchPostHogStats()
      ]);
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (profilesError) throw profilesError;

      // Récupérer les emails via Edge Function
      const userIds = profiles.map(p => p.id);
      const { data: emailsData, error: emailsError } = await supabase.functions.invoke('get-users-emails', {
        body: { userIds }
      });

      if (emailsError) {
        console.error('Erreur lors de la récupération des emails:', emailsError);
      }

      const emailsMap: Record<string, string> = emailsData?.emails || {};

      const usersWithEmails: RecentUser[] = profiles.map(profile => ({
        id: profile.id,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: emailsMap[profile.id] || '',
        created_at: profile.created_at,
        is_member: profile.is_member === true,
        avatar_url: profile.avatar_url
      }));

      setRecentUsers(usersWithEmails);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
    }
  };

  const fetchRecentComments = async () => {
    try {
      // Récupérer les commentaires de news
      const { data: newsComments, error: newsError } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (newsError) throw newsError;

      // Récupérer les commentaires de programme
      const { data: programComments, error: programError } = await supabase
        .from('program_comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (programError) throw programError;

      // Combiner et formater les commentaires
      const allComments: RecentComment[] = [];

      // Traiter les commentaires de news
      if (newsComments) {
        for (const comment of newsComments) {
          // Récupérer le profil utilisateur
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .eq('id', comment.user_id)
            .single();

          // Récupérer les infos de l'article
          const { data: news } = await supabase
            .from('news')
            .select('id, title, slug')
            .eq('id', comment.news_id)
            .single();

          allComments.push({
            ...comment,
            status: comment.status as CommentStatus,
            resource_type: 'news',
            resource_title: news?.title,
            resource_slug: news?.slug,
            profiles: profile || {
              id: comment.user_id,
              first_name: 'Utilisateur',
              last_name: ''
            }
          } as RecentComment);
        }
      }

      // Traiter les commentaires de programme
      if (programComments) {
        for (const comment of programComments) {
          // Récupérer le profil utilisateur
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .eq('id', comment.user_id)
            .single();

          // Récupérer les infos de l'item de programme
          const { data: programItem } = await supabase
            .from('program_items')
            .select('id, title')
            .eq('id', comment.program_item_id)
            .single();

          allComments.push({
            ...comment,
            status: comment.status as CommentStatus,
            resource_type: 'program',
            resource_title: programItem?.title,
            program_item_id: comment.program_item_id,
            profiles: profile || {
              id: comment.user_id,
              first_name: 'Utilisateur',
              last_name: ''
            }
          } as RecentComment);
        }
      }

      // Trier par date décroissante et limiter à 15
      allComments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRecentComments(allComments.slice(0, 15));
    } catch (error) {
      console.error("Erreur lors de la récupération des commentaires:", error);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const today = new Date().toISOString();
      const { data: events, error } = await supabase
        .from('events')
        .select('id, title, date, event_type, slug')
        .eq('status', 'published')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(10);

      if (error) throw error;

      const formattedEvents: UpcomingEvent[] = (events || []).map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        event_type: event.event_type,
        slug: event.slug
      }));

      setUpcomingEvents(formattedEvents);
      setUpcomingEventsCount(formattedEvents.length);
    } catch (error) {
      console.error("Erreur lors de la récupération des événements:", error);
    }
  };

  const fetchPostHogStats = async (period: string = postHogPeriod) => {
    try {
      // Essayer de récupérer les stats via Edge Function
      const { data, error } = await supabase.functions.invoke('get-posthog-stats', {
        body: { period }
      });

      if (error) {
        console.warn('PostHog stats non disponibles:', error);
        setPostHogStats(null);
        return;
      }

      if (data) {
        setPostHogStats(data);
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération des stats PostHog:', error);
      setPostHogStats(null);
    }
  };

  const handlePeriodChange = (period: string) => {
    setPostHogPeriod(period);
    fetchPostHogStats(period);
  };

  const getPeriodLabel = (period: string): string => {
    const labels: Record<string, string> = {
      '7days': '7 derniers jours',
      '30days': '30 derniers jours',
      'currentMonth': 'Mois actuel',
      'previousMonth': 'Mois précédent',
      'currentQuarter': 'Trimestre actuel',
      'previousQuarter': 'Trimestre précédent',
      'currentYear': 'Année actuelle',
      'previousYear': 'Année précédente'
    };
    return labels[period] || period;
  };

  const handleModerateComment = async (commentId: string, status: CommentStatus, resourceType: 'news' | 'program') => {
    try {
      const table = resourceType === 'news' ? 'comments' : 'program_comments';
      
      const { error } = await supabase
        .from(table)
        .update({ status })
        .eq('id', commentId);

      if (error) throw error;

      // Mettre à jour l'état local
      setRecentComments(prev => 
        prev.map(comment => 
          comment.id === commentId ? { ...comment, status } : comment
        )
      );

      toast({
        title: 'Commentaire modéré',
        description: `Le commentaire a été ${status === 'approved' ? 'approuvé' : status === 'rejected' ? 'rejeté' : 'mis en attente'}.`,
      });
    } catch (error: any) {
      console.error('Erreur lors de la modération:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modérer le commentaire.',
        variant: 'destructive',
      });
    }
  };

  const getCommentUrl = (comment: RecentComment): string => {
    if (comment.resource_type === 'news' && comment.resource_slug) {
      return `${generateRoutes.newsDetail(comment.resource_slug)}#comment-${comment.id}`;
    }
    return `${Routes.PROGRAM}#comment-${comment.id}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
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

      <AdminLayout title="Tableau de bord" description="Vue d'ensemble de l'activité du site et des dernières informations importantes.">
        <div className="py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="text-center py-10">
                <p>Chargement des données...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section Derniers utilisateurs */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Users className="h-5 w-5 mr-2 text-brand" />
                        Derniers utilisateurs
                      </CardTitle>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={Routes.ADMIN_USERS}>
                          Voir tous
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {recentUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun utilisateur récent</p>
                    ) : (
                      <div className="space-y-4">
                        {recentUsers.map((user) => (
                          <div key={user.id} className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>{getInitials(user.first_name, user.last_name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(user.created_at)}
                                </span>
                                {user.is_member && (
                                  <Badge variant="secondary" className="text-xs">Membre</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section Derniers commentaires */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-brand" />
                      Derniers commentaires
                    </CardTitle>
                    <CardDescription>
                      {recentComments.filter(c => c.status === 'pending').length > 0 && (
                        <Badge variant="destructive" className="mt-2">
                          {recentComments.filter(c => c.status === 'pending').length} en attente
                        </Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentComments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun commentaire récent</p>
                    ) : (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {recentComments.map((comment) => (
                          <div key={comment.id} className="border-b pb-4 last:border-0 last:pb-0">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.profiles?.avatar_url} />
                                <AvatarFallback>
                                  {getInitials(comment.profiles?.first_name || '', comment.profiles?.last_name || '')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium">
                                    {comment.profiles?.first_name} {comment.profiles?.last_name}
                                  </p>
                                  <Badge 
                                    variant={
                                      comment.status === 'approved' ? 'default' :
                                      comment.status === 'rejected' ? 'destructive' :
                                      'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {comment.status === 'approved' ? 'Approuvé' :
                                     comment.status === 'rejected' ? 'Rejeté' :
                                     'En attente'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  {comment.resource_type === 'news' ? 'Article' : 'Programme'}: {comment.resource_title || 'Sans titre'}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {comment.content}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDateTime(comment.created_at)}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    asChild
                                  >
                                    <a href={getCommentUrl(comment)} target="_blank" rel="noopener noreferrer">
                                      Voir sur le site
                                      <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                  </Button>
                                  {comment.status === 'pending' && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-xs border-green-500 text-green-600 hover:bg-green-50"
                                        onClick={() => handleModerateComment(comment.id, 'approved', comment.resource_type)}
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        Accepter
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-xs border-red-500 text-red-600 hover:bg-red-50"
                                        onClick={() => handleModerateComment(comment.id, 'rejected', comment.resource_type)}
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        Refuser
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section Prochains événements */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-brand" />
                        Prochains événements
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={Routes.ADMIN_EVENTS}>
                            Gérer
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={Routes.AGENDA}>
                            Voir l'agenda
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    {upcomingEventsCount < 5 && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Attention</AlertTitle>
                        <AlertDescription>
                          Il y a moins de 5 événements actifs à venir. Pensez à en ajouter pour maintenir l'engagement.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardHeader>
                  <CardContent>
                    {upcomingEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun événement à venir</p>
                    ) : (
                      <div className="space-y-3">
                        {upcomingEvents.map((event) => (
                          <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{event.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(event.date)}
                                </span>
                                {event.event_type && (
                                  <Badge variant="outline" className="text-xs">
                                    {event.event_type === 'neighborhood' ? 'Café de quartier' : 'Événement'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {event.slug && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={generateRoutes.eventDetail(event.slug)} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section Activité du site (PostHog) */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2 text-brand" />
                          Activité du site
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Statistiques - {getPeriodLabel(postHogPeriod)}
                        </CardDescription>
                      </div>
                      <Select value={postHogPeriod} onValueChange={handlePeriodChange}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Sélectionner une période" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7days">7 derniers jours</SelectItem>
                          <SelectItem value="30days">30 derniers jours</SelectItem>
                          <SelectItem value="currentMonth">Mois actuel</SelectItem>
                          <SelectItem value="previousMonth">Mois précédent</SelectItem>
                          <SelectItem value="currentQuarter">Trimestre actuel</SelectItem>
                          <SelectItem value="previousQuarter">Trimestre précédent</SelectItem>
                          <SelectItem value="currentYear">Année actuelle</SelectItem>
                          <SelectItem value="previousYear">Année précédente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {postHogStats ? (
                      <div className="space-y-6">
                        {/* Métriques principales */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-2xl font-bold">{postHogStats.uniqueVisitors}</p>
                            <p className="text-xs text-muted-foreground">Visiteurs uniques</p>
                            {postHogStats.trend.visitors !== 0 && (
                              <p className={`text-xs mt-1 ${postHogStats.trend.visitors > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {postHogStats.trend.visitors > 0 ? '+' : ''}{postHogStats.trend.visitors}%
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{postHogStats.pageViews}</p>
                            <p className="text-xs text-muted-foreground">Pages vues</p>
                            {postHogStats.trend.pageViews !== 0 && (
                              <p className={`text-xs mt-1 ${postHogStats.trend.pageViews > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {postHogStats.trend.pageViews > 0 ? '+' : ''}{postHogStats.trend.pageViews}%
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{postHogStats.events}</p>
                            <p className="text-xs text-muted-foreground">Événements</p>
                            {postHogStats.trend.events !== 0 && (
                              <p className={`text-xs mt-1 ${postHogStats.trend.events > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {postHogStats.trend.events > 0 ? '+' : ''}{postHogStats.trend.events}%
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Pages les plus visitées */}
                        {postHogStats.topPages && postHogStats.topPages.length > 0 && (
                          <div className="pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-3">Pages les plus visitées</h4>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                              {postHogStats.topPages.map((page, index) => (
                                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate" title={page.url}>
                                      {(() => {
                                        try {
                                          const url = new URL(page.url);
                                          return url.pathname || '/';
                                        } catch {
                                          return page.url.replace(/^https?:\/\/[^/]+/, '') || '/';
                                        }
                                      })()}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-muted-foreground">
                                        {page.views} vues
                                      </span>
                                      {page.avgTimeOnPage && (
                                        <span className="text-xs text-muted-foreground">
                                          • {Math.floor(page.avgTimeOnPage / 60)}:{String(page.avgTimeOnPage % 60).padStart(2, '0')} moy.
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className="ml-2">
                                    #{index + 1}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button variant="outline" size="sm" asChild className="w-full">
                          <a href="https://app.posthog.com" target="_blank" rel="noopener noreferrer">
                            Voir le dashboard complet
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Les statistiques PostHog ne sont pas disponibles. Vérifiez la configuration de l'Edge Function ou consultez directement le dashboard PostHog.
                        </p>
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <a href="https://app.posthog.com" target="_blank" rel="noopener noreferrer">
                            Ouvrir PostHog
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </HelmetProvider>
  );
};

export default AdminDashboardPage;

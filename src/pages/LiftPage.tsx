
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, UserPlus, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import LiftLayout from '@/components/lift/LiftLayout';
import LiftPostForm from '@/components/lift/LiftPostForm';
import LiftPostCard from '@/components/lift/LiftPostCard';
import LiftFilters from '@/components/lift/LiftFilters';

const LiftPage = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});

  useEffect(() => {
    fetchPosts();
  }, [showPastEvents, appliedFilters]);

  const isPostPast = (post: any) => {
    if (!post.date) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const postDate = new Date(post.date);
    postDate.setHours(0, 0, 0, 0);
    
    if (post.recurrence === 'once') {
      return postDate < today;
    }
    return false;
  };

  const applyFilters = (posts: any[], filters: any) => {
    return posts.filter(post => {
      // Filtre par date
      if (filters.dateFrom) {
        const postDate = new Date(post.date);
        const filterDate = new Date(filters.dateFrom);
        if (postDate < filterDate) return false;
      }
      
      if (filters.dateTo) {
        const postDate = new Date(post.date);
        const filterDate = new Date(filters.dateTo);
        if (postDate > filterDate) return false;
      }

      // Filtre par récurrence
      if (filters.recurrence && post.recurrence !== filters.recurrence) {
        return false;
      }

      // Filtre par horaire
      if (filters.timeFrom && post.time_start) {
        if (post.time_start < filters.timeFrom) return false;
      }
      
      if (filters.timeTo && post.time_start) {
        if (post.time_start > filters.timeTo) return false;
      }

      // Filtre par lieu de départ (recherche de mots-clés)
      if (filters.departureSearch) {
        const searchTerms = filters.departureSearch.toLowerCase().split(' ').filter(term => term.length > 0);
        const departureText = post.departure_location.toLowerCase();
        const hasAllTerms = searchTerms.every(term => departureText.includes(term));
        if (!hasAllTerms) return false;
      }

      // Filtre par lieu d'arrivée (recherche de mots-clés)
      if (filters.arrivalSearch) {
        const searchTerms = filters.arrivalSearch.toLowerCase().split(' ').filter(term => term.length > 0);
        const arrivalText = post.arrival_location.toLowerCase();
        const hasAllTerms = searchTerms.every(term => arrivalText.includes(term));
        if (!hasAllTerms) return false;
      }

      return true;
    });
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('lift_posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let filteredData = showPastEvents 
        ? data 
        : data.filter(post => !isPostPast(post));

      // Appliquer les filtres
      filteredData = applyFilters(filteredData, appliedFilters);

      setOffers(filteredData.filter(post => post.type === 'offer'));
      setRequests(filteredData.filter(post => post.type === 'request'));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (filters: any) => {
    setAppliedFilters(filters);
  };

  if (!user) {
    return (
      <HelmetProvider>
        <Helmet>
          <title>Lift - Covoiturage solidaire | Gétigné Collectif</title>
          <meta name="description" content="Partagez vos trajets quotidiens avec Lift, le covoiturage solidaire de Gétigné." />
        </Helmet>
        
        <LiftLayout>
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border-blue-200">
              <CardHeader>
                <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-blue-900">
                  Bienvenue sur Lift
                </CardTitle>
                <CardDescription className="text-lg">
                  La plateforme de covoiturage solidaire pour partager vos trajets quotidiens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Lift vous permet de mettre en relation des personnes qui souhaitent proposer 
                  un covoiturage ou profiter d'un covoit au quotidien. Partagez vos trajets 
                  et participez à une mobilité plus solidaire et écologique.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/auth">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <UserPlus className="mr-2 w-4 h-4" />
                      Créer un compte
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button variant="outline" className="border-blue-300 text-blue-700">
                      Se connecter
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </LiftLayout>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Lift - Covoiturage solidaire | Gétigné Collectif</title>
        <meta name="description" content="Partagez vos trajets quotidiens avec Lift, le covoiturage solidaire de Gétigné." />
      </Helmet>
      
      <LiftLayout>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">
              Partageons nos trajets quotidiens
            </h1>
            <p className="text-gray-700 text-lg">
              Trouvez des covoiturages ou proposez vos trajets pour une mobilité plus solidaire
            </p>
          </div>

          <Tabs defaultValue="offers" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-blue-100">
              <TabsTrigger value="offers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Car className="mr-2 w-4 h-4" />
                Propositions de trajet ({offers.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Users className="mr-2 w-4 h-4" />
                Demandes de covoiturage ({requests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="offers" className="space-y-6">
              <div className="flex justify-between items-center">
                <Button 
                  onClick={() => setShowOfferForm(true)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Car className="mr-2 w-5 h-5" />
                  Proposer un trajet
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(true)}
                  className="border-blue-300 text-blue-700"
                >
                  <Filter className="mr-2 w-4 h-4" />
                  Filtrer les résultats
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : offers.length > 0 ? (
                <div className="space-y-4">
                  {offers.map((offer) => (
                    <LiftPostCard
                      key={offer.id}
                      post={offer}
                      onUpdate={fetchPosts}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Car className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">Aucune proposition de trajet pour le moment</p>
                  <p className="text-gray-500 text-sm">Soyez le premier à proposer un covoiturage !</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-6">
              <div className="flex justify-between items-center">
                <Button 
                  onClick={() => setShowRequestForm(true)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Users className="mr-2 w-5 h-5" />
                  Faire une demande
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(true)}
                  className="border-blue-300 text-blue-700"
                >
                  <Filter className="mr-2 w-4 h-4" />
                  Filtrer les résultats
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : requests.length > 0 ? (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <LiftPostCard
                      key={request.id}
                      post={request}
                      onUpdate={fetchPosts}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">Aucune demande de covoiturage pour le moment</p>
                  <p className="text-gray-500 text-sm">Soyez le premier à faire une demande !</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Modales de formulaires */}
        <LiftPostForm
          type="offer"
          isOpen={showOfferForm}
          onClose={() => setShowOfferForm(false)}
          onSuccess={fetchPosts}
        />

        <LiftPostForm
          type="request"
          isOpen={showRequestForm}
          onClose={() => setShowRequestForm(false)}
          onSuccess={fetchPosts}
        />

        {/* Système de filtres */}
        <LiftFilters
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          onApplyFilters={handleApplyFilters}
          showPastEvents={showPastEvents}
          onTogglePastEvents={setShowPastEvents}
        />
      </LiftLayout>
    </HelmetProvider>
  );
};

export default LiftPage;

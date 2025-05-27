
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import LiftLayout from '@/components/lift/LiftLayout';
import LiftPostForm from '@/components/lift/LiftPostForm';
import LiftPostCard from '@/components/lift/LiftPostCard';

const LiftPage = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('lift_posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOffers(data.filter(post => post.type === 'offer'));
      setRequests(data.filter(post => post.type === 'request'));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
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
            <Card className="border-orange-200">
              <CardHeader>
                <div className="mx-auto mb-4 p-4 bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle className="text-2xl text-orange-900">
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
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                      <UserPlus className="mr-2 w-4 h-4" />
                      Créer un compte
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button variant="outline" className="border-orange-300 text-orange-700">
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
            <h1 className="text-3xl font-bold text-orange-900 mb-2">
              Partageons nos trajets quotidiens
            </h1>
            <p className="text-gray-700 text-lg">
              Trouvez des covoiturages ou proposez vos trajets pour une mobilité plus solidaire
            </p>
          </div>

          <Tabs defaultValue="offers" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-orange-100">
              <TabsTrigger value="offers" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                <Car className="mr-2 w-4 h-4" />
                Propositions de trajet ({offers.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                <Users className="mr-2 w-4 h-4" />
                Demandes de covoiturage ({requests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="offers" className="space-y-6">
              <div className="flex justify-center">
                <Button 
                  onClick={() => setShowOfferForm(true)}
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Car className="mr-2 w-5 h-5" />
                  Proposer un trajet
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : offers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <div className="flex justify-center">
                <Button 
                  onClick={() => setShowRequestForm(true)}
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Users className="mr-2 w-5 h-5" />
                  Faire une demande
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : requests.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      </LiftLayout>
    </HelmetProvider>
  );
};

export default LiftPage;


import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Home, Download, User, Users } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

const AboutUsPage = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [boardMembers, setBoardMembers] = useState([]);
  const [electedMembers, setElectedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchTeamMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*');

        if (error) throw error;

        // Filter members by role
        const board = data.filter(member => member.is_board_member);
        const elected = data.filter(member => member.is_elected);

        setTeamMembers(data);
        setBoardMembers(board);
        setElectedMembers(elected);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des membres de l\'équipe:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  const TeamMember = ({ member, index }) => {
    return (
      <div
        className="bg-white rounded-xl overflow-hidden shadow-sm border border-getigne-100 hover-lift transition-all duration-300 hover:shadow-md"
      >
        <div className="h-48 overflow-hidden">
          <img
            src={member.image}
            alt={member.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
        <div className="p-6">
          <h3 className="font-medium text-xl mb-1">{member.name}</h3>
          <div className="text-getigne-accent font-medium text-sm mb-3">{member.role}</div>
          <p className="text-getigne-700 mb-4">{member.bio}</p>
        </div>
      </div>
    );
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>Qui sommes-nous ? | Gétigné Collectif</title>
        <meta
          name="description"
          content="Découvrez Gétigné Collectif, notre histoire, nos valeurs et nos membres engagés pour une commune plus écologique, solidaire et démocratique."
        />
      </Helmet>

      <div>
        <div className="min-h-screen">
        <Navbar />


          {/* Header */}
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
                    <BreadcrumbPage>Qui sommes-nous ?</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="max-w-3xl mx-auto text-center">
                <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                  Notre collectif
                </span>
                <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Qui sommes-nous ?</h1>
                <p className="text-getigne-700 text-lg mb-6">
                  Découvrez l'histoire du Gétigné Collectif, nos valeurs, notre vision pour la commune
                  et les personnes engagées dans ce projet citoyen.
                </p>
              </div>
            </div>
          </div>

          {/* Our DNA Section */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                    Notre identité
                  </span>
                  <h2 className="text-3xl font-bold mt-4 mb-6">Notre ADN</h2>
                  <p className="text-getigne-700 mb-6">
                    Notre collectif est né d'une volonté citoyenne de s'engager pour le bien commun. Nous sommes des habitants de Gétigné, animés par l'envie de faire de notre commune un lieu où il fait bon vivre, ensemble et durablement.
                  </p>
                  <p className="text-getigne-700 mb-6">
                    Face aux défis écologiques, sociaux et démocratiques de notre époque, nous avons décidé de nous rassembler pour proposer une alternative politique locale qui répond aux enjeux actuels et futurs de notre territoire.
                  </p>
                  <p className="text-getigne-700">
                    Nous croyons en une politique locale transparente, collaborative et tournée vers l'avenir, qui place les citoyens au cœur des décisions qui impactent leur quotidien. Notre démarche est guidée par la conviction que les solutions les plus durables et les plus justes émergent du dialogue et de l'intelligence collective.
                  </p>
                </div>
                <div className="rounded-xl overflow-hidden shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2232&q=80"
                    alt="Membres du collectif en discussion"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Our Values Section */}
          <section className="py-16 bg-getigne-50">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                  Ce qui nous guide
                </span>
                <h2 className="text-3xl font-bold mt-4 mb-6">Nos valeurs fondamentales</h2>
                <p className="text-getigne-700">
                  Nos actions et décisions sont guidées par un ensemble de valeurs que nous défendons collectivement.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-xl font-semibold mb-4">Solidarité</h3>
                  <p className="text-getigne-700">
                    Nous croyons en une commune qui prend soin de chacun, qui n'oublie personne et qui favorise l'entraide entre habitants. Nous voulons construire une communauté où chacun a sa place et où les plus vulnérables sont accompagnés et soutenus.
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-xl font-semibold mb-4">Écologie</h3>
                  <p className="text-getigne-700">
                    Nous sommes convaincus de la nécessité d'agir localement pour préserver notre environnement et assurer un avenir viable aux générations futures. Nous défendons une transition écologique qui respecte les équilibres naturels et améliore notre qualité de vie.
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-xl font-semibold mb-4">Démocratie participative</h3>
                  <p className="text-getigne-700">
                    Nous voulons redonner aux citoyens la possibilité de s'exprimer et d'agir sur les décisions qui les concernent. Nous croyons en l'intelligence collective et au dialogue constructif pour élaborer des solutions adaptées aux besoins de tous.
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-xl font-semibold mb-4">Transparence</h3>
                  <p className="text-getigne-700">
                    Nous nous engageons à informer clairement les citoyens sur les décisions prises et à expliquer nos choix. Nous croyons qu'une démocratie saine repose sur l'accès à l'information et la confiance entre élus et citoyens.
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-xl font-semibold mb-4">Innovation</h3>
                  <p className="text-getigne-700">
                    Nous encourageons l'expérimentation et l'innovation pour répondre aux défis actuels. Nous sommes ouverts aux nouvelles idées et aux solutions créatives qui peuvent améliorer la vie dans notre commune.
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-xl font-semibold mb-4">Respect</h3>
                  <p className="text-getigne-700">
                    Nous valorisons la diversité des opinions et des parcours. Nous croyons au dialogue respectueux et constructif, même dans le désaccord, et nous rejetons toute forme de discrimination.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Association Status Section */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="md:order-2">
                  <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                    Notre organisation
                  </span>
                  <h2 className="text-3xl font-bold mt-4 mb-6">Notre statut associatif</h2>
                  <p className="text-getigne-700 mb-6">
                    Notre collectif est organisé en association loi 1901, ce qui nous permet d'agir de manière indépendante et structurée. Nous fonctionnons grâce à l'engagement bénévole de nos membres et aux cotisations qui financent nos actions.
                  </p>
                  <p className="text-getigne-700 mb-6">
                    Le bureau de l'association coordonne les activités et s'assure que nos initiatives s'inscrivent dans les valeurs que nous défendons. Les décisions importantes sont prises collectivement lors de nos assemblées générales.
                  </p>
                  <p className="text-getigne-700 mb-6">
                    Notre association est ouverte à toutes les personnes qui partagent nos valeurs et souhaitent s'engager pour l'avenir de Gétigné. Nous accueillons la diversité des compétences, des idées et des énergies.
                  </p>
                  <div className="flex space-x-4">
                    <Button
                      className="bg-getigne-accent hover:bg-getigne-accent/90 text-white flex items-center"
                    >
                      <Download className="mr-2 h-4 w-4" /> Télécharger nos statuts
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-getigne-accent text-getigne-accent hover:bg-getigne-accent/5"
                    >
                      <a href="/adherer">Rejoignez-nous</a>
                    </Button>
                  </div>
                </div>
                <div className="md:order-1 rounded-xl overflow-hidden shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                    alt="Réunion de l'association"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Our Approach Section */}
          <section className="py-16 bg-getigne-50">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                  Notre méthode
                </span>
                <h2 className="text-3xl font-bold mt-4 mb-6">Notre approche</h2>
                <p className="text-getigne-700">
                  Comment nous travaillons pour construire des projets concrets et utiles pour notre commune.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-xl font-semibold mb-4">Commissions citoyennes</h3>
                  <p className="text-getigne-700 mb-6">
                    Nous croyons profondément que les citoyens doivent être impliqués dans les décisions qui façonnent leur quotidien. C'est pourquoi nous avons mis en place des commissions citoyennes ouvertes à tous.
                  </p>
                  <p className="text-getigne-700 mb-4">
                    Ces espaces de dialogue permettent à chacun d'apporter ses idées, ses compétences et son énergie pour construire ensemble des projets concrets pour notre commune.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="border-getigne-accent text-getigne-accent hover:bg-getigne-accent/5 mt-4"
                  >
                    <a href="/commissions">Découvrir les commissions</a>
                  </Button>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-xl font-semibold mb-4">Consultation et co-construction</h3>
                  <p className="text-getigne-700 mb-6">
                    Nous ne croyons pas aux solutions imposées d'en haut. Pour chaque projet important, nous organisons des phases de consultation des habitants et des parties prenantes.
                  </p>
                  <p className="text-getigne-700 mb-4">
                    Cette démarche de co-construction permet d'enrichir les projets grâce à l'expertise d'usage des habitants et d'assurer que les solutions proposées répondent réellement aux besoins du terrain.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="border-getigne-accent text-getigne-accent hover:bg-getigne-accent/5 mt-4"
                  >
                    <a href="/agenda">Voir nos prochains ateliers</a>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                  Notre équipe
                </span>
                <h2 className="text-3xl font-bold mt-4 mb-6">Les membres du collectif</h2>
                <p className="text-getigne-700 mb-8">
                  Découvrez les personnes engagées qui portent le projet de Gétigné Collectif.
                </p>

                <Tabs defaultValue="bureau" className="max-w-2xl mx-auto">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bureau" className="text-sm">
                      <User className="h-4 w-4 mr-2" /> Bureau de l'association
                    </TabsTrigger>
                    <TabsTrigger value="elus" className="text-sm">
                      <Users className="h-4 w-4 mr-2" /> Élus municipaux
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="bureau" className="mt-8">
                    {loading ? (
                      <div className="text-center py-8">Chargement des membres...</div>
                    ) : error ? (
                      <div className="text-center py-8 text-red-500">Une erreur est survenue: {error}</div>
                    ) : (
                      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {boardMembers.map((member, index) => (
                          <TeamMember key={member.id} member={member} index={index} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="elus" className="mt-8">
                    {loading ? (
                      <div className="text-center py-8">Chargement des membres...</div>
                    ) : error ? (
                      <div className="text-center py-8 text-red-500">Une erreur est survenue: {error}</div>
                    ) : (
                      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {electedMembers.map((member, index) => (
                          <TeamMember key={member.id} member={member} index={index} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 bg-getigne-accent/10">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-6">Envie de nous rejoindre ?</h2>
              <p className="text-getigne-700 mb-8 max-w-2xl mx-auto">
                Vous partagez nos valeurs et notre vision pour Gétigné ? Rejoignez notre collectif et participez à la construction d'une commune plus écologique, solidaire et démocratique.
              </p>
              <Button
                asChild
                className="bg-getigne-accent hover:bg-getigne-accent/90 text-white"
              >
                <a href="/adherer">Rejoignez le mouvement</a>
              </Button>
            </div>
          </section>
        </div>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default AboutUsPage;

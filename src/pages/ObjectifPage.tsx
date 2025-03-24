
import { useEffect } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  BrainCircuit, 
  ShieldCheck, 
  Heart, 
  Users, 
  Leaf, 
  Calendar, 
  PenTool,
  BookOpen, 
  UserCheck,
  Vote,
  GitBranch
} from 'lucide-react';
import CitizenCommittees from '@/components/CitizenCommittees';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ObjectifPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <HelmetProvider>
      <Helmet>
        <title>Objectif 2026 | Gétigné Collectif</title>
        <meta
          name="description"
          content="Notre projet pour les élections municipales de 2026 à Gétigné : une commune plus écologique, solidaire et démocratique."
        />
      </Helmet>

      <div className="page-content">
        <Navbar />
        
        <div className="pt-24 bg-getigne-50">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                Élections municipales 2026
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Objectif 2026</h1>
              <p className="text-getigne-700 text-lg">
                Ensemble, construisons une commune plus écologique, solidaire et démocratique pour les élections municipales de 2026.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-16">
              <div className="grid md:grid-cols-2">
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <h2 className="text-3xl font-bold mb-6 text-getigne-900">Vers un renouveau collectif</h2>
                  <p className="text-getigne-700 mb-6">
                    Depuis mai 2024, le collectif s'est engagé dans une démarche ambitieuse : 
                    élaborer un programme qui répond aux défis de notre commune pour les prochaines années.
                  </p>
                  <p className="text-getigne-700 mb-6">
                    Nous sommes convaincus que Gétigné a besoin d'un souffle nouveau, d'idées innovantes 
                    et d'une équipe dynamique pour construire un avenir plus durable, plus solidaire et plus participatif.
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <Button asChild className="bg-getigne-accent hover:bg-getigne-accent/90">
                      <Link to="/objectif-2026/commissions">Découvrir nos commissions</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/adherer">Rejoindre le collectif</Link>
                    </Button>
                  </div>
                </div>
                <div className="h-64 md:h-auto bg-getigne-100">
                  <img 
                    src="/lovable-uploads/07e7372b-7c2e-4584-9a92-9becd5096172.png" 
                    alt="Réunion du collectif" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Vision et méthode */}
            <div className="mb-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">Notre vision et notre méthode</h2>
                <p className="text-getigne-700 mt-3 max-w-2xl mx-auto">
                  Une approche différente, participative et transparente pour construire ensemble la commune de demain.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <BrainCircuit className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Intelligence collective</h3>
                  <p className="text-getigne-700">
                    Nous croyons au pouvoir des idées partagées et de la co-construction. 
                    Chaque citoyen a une expertise à apporter au projet collectif.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <ShieldCheck className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Engagement responsable</h3>
                  <p className="text-getigne-700">
                    Nous nous engageons à mener une politique transparente et responsable, 
                    avec une vision à long terme pour notre commune.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <Heart className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Solidarité renforcée</h3>
                  <p className="text-getigne-700">
                    Une commune qui n'oublie personne et qui crée du lien entre tous les habitants, 
                    quels que soient leur âge ou leur situation.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <Users className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Démocratie participative</h3>
                  <p className="text-getigne-700">
                    Les citoyens au cœur de la prise de décision, avec des consultations régulières 
                    et des outils innovants de participation citoyenne.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <Leaf className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Transition écologique</h3>
                  <p className="text-getigne-700">
                    Des actions concrètes pour une commune plus verte, plus durable, 
                    qui préserve son patrimoine naturel et prépare l'avenir.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-getigne-100 hover-lift">
                  <div className="bg-getigne-accent/10 p-3 w-12 h-12 rounded-lg mb-4 flex items-center justify-center">
                    <PenTool className="text-getigne-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Créativité locale</h3>
                  <p className="text-getigne-700">
                    Valoriser et dynamiser notre territoire par la culture, l'innovation 
                    et l'accompagnement des initiatives locales.
                  </p>
                </div>
              </div>
            </div>

            {/* Méthodologie inspirée de Rob Hopkins */}
            <div className="bg-white rounded-xl shadow-md p-8 md:p-12 mb-16">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center mb-6">
                  <div className="bg-getigne-accent/10 p-3 rounded-full mr-4">
                    <BookOpen className="text-getigne-accent h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold">Notre démarche méthodologique</h2>
                </div>
                
                <p className="text-getigne-700 mb-8">
                  Notre approche s'inspire des travaux de Rob Hopkins, fondateur du mouvement des villes en transition, 
                  qui propose une méthode pour mobiliser les communautés locales face aux défis écologiques et sociaux.
                </p>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-getigne-accent pl-6 py-2">
                    <h3 className="font-semibold text-xl mb-2">L'imaginaire positif</h3>
                    <p className="text-getigne-700">
                      Au lieu de s'enfermer dans une vision catastrophiste, nous misons sur la capacité à imaginer 
                      collectivement un futur désirable. Selon Hopkins, "si nous ne pouvons pas imaginer un futur positif, 
                      nous ne pourrons pas le créer". C'est pourquoi nous organisons régulièrement des ateliers 
                      de vision positive pour Gétigné.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-getigne-accent pl-6 py-2">
                    <h3 className="font-semibold text-xl mb-2">La résilience locale</h3>
                    <p className="text-getigne-700">
                      Nous développons la capacité de notre commune à faire face aux chocs et aux crises, 
                      qu'ils soient climatiques, économiques ou sociaux. Cela passe par la relocalisation de 
                      l'économie, le renforcement des liens sociaux et la préservation des ressources naturelles.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-getigne-accent pl-6 py-2">
                    <h3 className="font-semibold text-xl mb-2">L'inclusion et la diversité</h3>
                    <p className="text-getigne-700">
                      Notre projet s'enrichit de la diversité des points de vue et des expériences. 
                      Nous veillons à ce que toutes les voix puissent s'exprimer, en particulier celles qui sont 
                      habituellement peu entendues. La transition ne peut réussir que si elle est inclusive.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-getigne-accent pl-6 py-2">
                    <h3 className="font-semibold text-xl mb-2">Des actions concrètes à petite échelle</h3>
                    <p className="text-getigne-700">
                      Comme le préconise Hopkins, nous croyons à la force des petites actions concrètes qui, 
                      mises bout à bout, transforment profondément nos modes de vie. Ces initiatives locales 
                      permettent de montrer que le changement est possible et d'inspirer d'autres actions.
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 border rounded-lg p-6 bg-getigne-50">
                  <h3 className="font-semibold text-xl mb-3">À lire pour aller plus loin :</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-getigne-accent mr-2">•</span>
                      <span>"Manuel de Transition" de Rob Hopkins - Le guide fondateur du mouvement des villes en transition</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-getigne-accent mr-2">•</span>
                      <span>"Et si... on libérait notre imagination pour créer le futur que nous voulons ?" de Rob Hopkins</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-getigne-accent mr-2">•</span>
                      <span>"Le pouvoir d'agir ensemble, ici et maintenant" de Rob Hopkins</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Notre gouvernance et élection sans candidat */}
            <div className="bg-white rounded-xl shadow-md p-8 md:p-12 mb-16">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center mb-6">
                  <div className="bg-getigne-accent/10 p-3 rounded-full mr-4">
                    <GitBranch className="text-getigne-accent h-6 w-6" />
                  </div>
                  <h2 className="text-3xl font-bold">Notre gouvernance</h2>
                </div>
                
                <p className="text-getigne-700 mb-8">
                  Notre collectif a fait le choix d'une gouvernance partagée et horizontale, qui laisse la place à 
                  l'intelligence collective et à la contribution de chacun selon ses compétences, disponibilités et envies.
                </p>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-getigne-accent/5 p-6 rounded-lg">
                    <div className="flex items-center mb-4">
                      <Users className="text-getigne-accent mr-3" />
                      <h3 className="font-semibold text-xl">Structure en cercles</h3>
                    </div>
                    <p className="text-getigne-700">
                      Notre organisation est structurée en cercles thématiques (commissions citoyennes) 
                      et fonctionnels (communication, animation, coordination). Chaque cercle dispose d'une 
                      autonomie dans son fonctionnement et ses prises de décision, tout en restant aligné 
                      avec les valeurs et objectifs du collectif.
                    </p>
                  </div>
                  
                  <div className="bg-getigne-accent/5 p-6 rounded-lg">
                    <div className="flex items-center mb-4">
                      <UserCheck className="text-getigne-accent mr-3" />
                      <h3 className="font-semibold text-xl">Prise de décision par consentement</h3>
                    </div>
                    <p className="text-getigne-700">
                      Nous privilégions la prise de décision par consentement plutôt que par consensus. 
                      Une proposition est adoptée non pas lorsque tout le monde est d'accord, mais lorsque 
                      personne n'a d'objection argumentée. Cela permet d'avancer efficacement tout en 
                      s'assurant que toutes les préoccupations sont prises en compte.
                    </p>
                  </div>
                </div>
                
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Vote className="text-getigne-accent mr-3" />
                    <h3 className="font-semibold text-xl">Élection sans candidat : choisir notre tête de liste</h3>
                  </div>
                  <p className="text-getigne-700 mb-4">
                    Pour désigner notre tête de liste pour les élections municipales, nous avons choisi 
                    un processus innovant et peu connu : l'élection sans candidat (ESC). Cette méthode reflète 
                    notre vision de la démocratie et notre volonté de valoriser les compétences plutôt que 
                    les ambitions personnelles.
                  </p>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="what-is-esc">
                      <AccordionTrigger>Qu'est-ce qu'une élection sans candidat ?</AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-3">
                          L'élection sans candidat (ESC) est un processus issu de la sociocratie qui permet 
                          de choisir une personne pour un rôle sans que celle-ci ait à se déclarer candidate.
                        </p>
                        <p>
                          Contrairement aux élections traditionnelles où les candidats font campagne pour 
                          obtenir des voix, l'ESC repose sur la capacité du groupe à identifier collectivement 
                          la personne la plus adaptée pour un rôle spécifique, en fonction de ses compétences, 
                          de son expérience et de sa légitimité aux yeux du groupe.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="why-esc">
                      <AccordionTrigger>Pourquoi ce choix pour notre collectif ?</AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-3">
                          Nous avons choisi cette méthode pour plusieurs raisons :
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mb-3">
                          <li>
                            Elle permet d'éviter les jeux d'ego et les luttes de pouvoir qui peuvent diviser un collectif
                          </li>
                          <li>
                            Elle valorise les compétences réelles plutôt que la capacité à se mettre en avant
                          </li>
                          <li>
                            Elle renforce la cohésion du groupe en créant un consensus autour de la personne choisie
                          </li>
                          <li>
                            Elle évite la pression excessive sur les personnes qui n'oseraient pas se déclarer candidates
                            mais qui pourraient être d'excellentes têtes de liste
                          </li>
                        </ul>
                        <p>
                          C'est aussi une façon de rester cohérents avec notre vision de la démocratie 
                          participative que nous souhaitons mettre en œuvre à Gétigné.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="how-esc-works">
                      <AccordionTrigger>Comment se déroule ce processus ?</AccordionTrigger>
                      <AccordionContent>
                        <ol className="list-decimal pl-5 space-y-3">
                          <li>
                            <strong>Définition du rôle</strong> : Nous commençons par définir clairement le rôle 
                            de tête de liste, ses responsabilités et les qualités requises.
                          </li>
                          <li>
                            <strong>Réflexion individuelle</strong> : Chaque membre réfléchit à la personne qui 
                            lui semble la plus adaptée pour ce rôle, sans discussion collective.
                          </li>
                          <li>
                            <strong>Tour de nomination</strong> : Chacun nomme publiquement la personne qu'il 
                            propose et explique ses raisons (compétences, expérience, qualités humaines...).
                          </li>
                          <li>
                            <strong>Tour de réaction</strong> : Chacun peut réagir aux propositions faites, ce qui 
                            permet d'enrichir la réflexion collective.
                          </li>
                          <li>
                            <strong>Possibilité de modifier son choix</strong> : Après avoir entendu les arguments, 
                            chacun peut modifier sa proposition.
                          </li>
                          <li>
                            <strong>Proposition d'une personne par le facilitateur</strong> : En fonction des 
                            arguments avancés, le facilitateur propose un nom.
                          </li>
                          <li>
                            <strong>Tour de consentement</strong> : Chacun exprime son consentement ou ses objections.
                          </li>
                          <li>
                            <strong>Célébration</strong> : Une fois la personne désignée, le groupe célèbre ce choix 
                            et s'engage à la soutenir dans son rôle.
                          </li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="when-esc">
                      <AccordionTrigger>Quand aura lieu cette élection ?</AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-3">
                          Contrairement à la pratique habituelle qui consiste à désigner une tête de liste 
                          très tôt dans le processus électoral, nous avons choisi de retarder cette désignation 
                          le plus tard possible, probablement fin 2025.
                        </p>
                        <p className="mb-3">
                          Cette approche nous permet de :
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>
                            Construire d'abord un projet collectif solide, qui ne repose pas sur une personnalité
                          </li>
                          <li>
                            Laisser le temps aux membres du collectif de se connaître et de travailler ensemble
                          </li>
                          <li>
                            Identifier naturellement les compétences et les leaderships au sein du groupe
                          </li>
                          <li>
                            Éviter que les médias et le débat public ne se focalisent uniquement sur la 
                            personnalité de la tête de liste plutôt que sur notre projet pour Gétigné
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </div>

            {/* Section Commissions Citoyennes */}
            <CitizenCommittees />

            {/* Engagez-vous section */}
            <div className="bg-getigne-accent/5 rounded-xl p-8 md:p-12 mb-16">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-6">Engagez-vous dans la campagne !</h2>
                  <p className="text-getigne-700 mb-6">
                    Rejoignez notre équipe "Animation" et participez à l'organisation d'événements 
                    pour faire découvrir notre projet aux habitants de Gétigné.
                  </p>
                  <p className="text-getigne-700 mb-6">
                    Que vous soyez disponible ponctuellement ou régulièrement, nous avons besoin 
                    de votre énergie et de vos idées pour faire vivre cette campagne !
                  </p>
                  <div className="flex space-x-4 mt-4">
                    <Button asChild>
                      <Link to="/adherer">Devenir bénévole</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/contact">Nous contacter</Link>
                    </Button>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="bg-white p-6 rounded-xl shadow-md grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-getigne-accent" />
                        <span>Organiser</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Users className="text-getigne-accent" />
                        <span>Mobiliser</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <PenTool className="text-getigne-accent" />
                        <span>Créer</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Heart className="text-getigne-accent" />
                        <span>Partager</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Photos grid */}
            <div className="mb-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold">Un collectif en action</h2>
                <p className="text-getigne-700 mt-3 max-w-2xl mx-auto">
                  Découvrez nos activités et nos rencontres avec les citoyens de Gétigné.
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="relative rounded-lg overflow-hidden h-48 col-span-2">
                  <img 
                    src="/lovable-uploads/07e7372b-7c2e-4584-9a92-9becd5096172.png" 
                    alt="Réunion du collectif" 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="relative rounded-lg overflow-hidden h-48">
                  <img 
                    src="/lovable-uploads/07e7372b-7c2e-4584-9a92-9becd5096172.png" 
                    alt="Atelier participatif" 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="relative rounded-lg overflow-hidden h-48">
                  <img 
                    src="/lovable-uploads/07e7372b-7c2e-4584-9a92-9becd5096172.png" 
                    alt="Réunion publique" 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="relative rounded-lg overflow-hidden h-48">
                  <img 
                    src="/lovable-uploads/07e7372b-7c2e-4584-9a92-9becd5096172.png" 
                    alt="Visite de terrain" 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="relative rounded-lg overflow-hidden h-48 col-span-2">
                  <img 
                    src="/lovable-uploads/07e7372b-7c2e-4584-9a92-9becd5096172.png" 
                    alt="Stand marché" 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default ObjectifPage;

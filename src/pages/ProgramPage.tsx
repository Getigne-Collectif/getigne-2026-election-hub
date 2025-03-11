
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Leaf, Users, Building, Book, Lightbulb, Heart, Shield, BarChart3 } from 'lucide-react';

const ProgramSection = ({ icon: Icon, title, description, points }) => {
  return (
    <div className="mb-16">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-getigne-accent/10 rounded-lg flex items-center justify-center">
          <Icon className="text-getigne-accent" size={24} />
        </div>
        <h3 className="text-2xl font-bold">{title}</h3>
      </div>
      <p className="text-getigne-700 text-lg mb-6 ml-15">{description}</p>
      <ul className="space-y-4 ml-15">
        {points.map((point, index) => (
          <li key={index} className="flex items-start">
            <div className="w-6 h-6 rounded-full bg-getigne-accent/10 flex items-center justify-center text-getigne-accent mr-3 mt-0.5 flex-shrink-0">
              {index + 1}
            </div>
            <p className="text-getigne-800">{point}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ProgramPage = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const programSections = [
    {
      icon: Leaf,
      title: "Transition écologique",
      description: "Faire de Gétigné une commune exemplaire en matière de transition écologique, résiliente face aux défis climatiques.",
      points: [
        "Développer un plan ambitieux de rénovation énergétique des bâtiments communaux.",
        "Créer des îlots de fraîcheur et développer les espaces verts dans toute la commune.",
        "Favoriser la mobilité douce avec un réseau de pistes cyclables sécurisées.",
        "Mettre en place une alimentation biologique et locale dans la restauration scolaire.",
        "Encourager l'installation d'un maraîchage bio et local pour approvisionner la commune."
      ]
    },
    {
      icon: Building,
      title: "Cadre de vie",
      description: "Aménager notre commune pour améliorer la qualité de vie de tous les habitants, quel que soit leur âge ou leur quartier.",
      points: [
        "Élaborer un plan d'urbanisme respectueux de l'identité de notre commune.",
        "Créer des espaces publics conviviaux et inclusifs dans tous les quartiers.",
        "Mettre en place une politique de logement accessible et diversifié.",
        "Sécuriser les abords des écoles et les zones piétonnes.",
        "Valoriser le patrimoine local et les espaces naturels remarquables."
      ]
    },
    {
      icon: Users,
      title: "Solidarité & Inclusion",
      description: "Renforcer le lien social et veiller à ce que personne ne soit laissé de côté dans notre commune.",
      points: [
        "Développer les services de proximité pour les personnes âgées ou en situation de handicap.",
        "Créer une maison des associations pour favoriser l'engagement citoyen.",
        "Mettre en place un dispositif de soutien aux familles en difficulté.",
        "Soutenir les initiatives intergénérationnelles et de partage de compétences.",
        "Œuvrer pour l'accessibilité de tous les équipements publics."
      ]
    },
    {
      icon: BarChart3,
      title: "Économie locale",
      description: "Dynamiser l'économie locale en favorisant les circuits courts et en soutenant nos commerces de proximité.",
      points: [
        "Créer un marché hebdomadaire de producteurs locaux en centre-ville.",
        "Mettre en place un incubateur pour accompagner les projets d'entreprises locales.",
        "Favoriser l'implantation de commerces diversifiés dans le centre-ville.",
        "Créer une monnaie locale pour dynamiser les échanges dans la commune.",
        "Mettre en valeur l'artisanat local et favoriser les achats responsables."
      ]
    },
    {
      icon: Book,
      title: "Éducation & Jeunesse",
      description: "Investir dans l'avenir de notre commune en soutenant notre jeunesse et en développant des projets éducatifs ambitieux.",
      points: [
        "Rénover et moderniser les écoles de la commune.",
        "Développer les activités périscolaires autour de la citoyenneté et de l'écologie.",
        "Créer un conseil municipal des jeunes pour impliquer la jeunesse dans la vie locale.",
        "Mettre en place un soutien scolaire gratuit pour les élèves en difficulté.",
        "Développer les infrastructures sportives et culturelles pour les jeunes."
      ]
    },
    {
      icon: Heart,
      title: "Santé & Bien-être",
      description: "Veiller à la santé et au bien-être de tous les habitants en améliorant l'accès aux soins et en favorisant un environnement sain.",
      points: [
        "Lutter contre les déserts médicaux en favorisant l'installation de professionnels de santé.",
        "Créer une maison de santé pluridisciplinaire accessible à tous.",
        "Développer des initiatives de prévention et d'éducation à la santé.",
        "Aménager des parcours de santé dans les espaces verts de la commune.",
        "Veiller à la qualité de l'air et de l'eau dans notre commune."
      ]
    },
    {
      icon: Shield,
      title: "Sécurité & Tranquillité",
      description: "Assurer la sécurité et la tranquillité de tous les habitants en privilégiant la prévention et la médiation.",
      points: [
        "Renforcer la présence des médiateurs de rue dans les quartiers.",
        "Améliorer l'éclairage public tout en respectant les enjeux énergétiques.",
        "Mettre en place des actions de prévention routière, notamment aux abords des écoles.",
        "Lutter contre les incivilités par la sensibilisation et l'éducation.",
        "Développer les systèmes d'entraide entre voisins."
      ]
    },
    {
      icon: Lightbulb,
      title: "Démocratie participative",
      description: "Impliquer les citoyens dans les décisions qui les concernent et faire vivre la démocratie locale au quotidien.",
      points: [
        "Mettre en place un budget participatif pour des projets proposés par les habitants.",
        "Créer des conseils de quartier avec un pouvoir de proposition réel.",
        "Organiser régulièrement des consultations citoyennes sur les grands projets.",
        "Rendre transparentes les décisions municipales avec une communication claire et accessible.",
        "Former les habitants qui le souhaitent aux enjeux de la gestion municipale."
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 pb-12 bg-getigne-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
              Notre vision pour Gétigné
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Programme municipal 2026</h1>
            <p className="text-getigne-700 text-lg mb-8">
              Découvrez nos propositions concrètes pour faire de Gétigné une commune où il fait bon vivre, 
              solidaire, écologique et tournée vers l'avenir.
            </p>
          </div>
        </div>
      </div>

      {/* Program content */}
      <main className="flex-grow py-16">
        <div className="container mx-auto px-4">
          {/* Introduction */}
          <div className="max-w-3xl mx-auto mb-16 pb-10 border-b border-getigne-100">
            <h2 className="text-3xl font-bold mb-6">Notre vision pour Gétigné</h2>
            <p className="text-getigne-700 text-lg mb-4">
              Gétigné Collectif est né de la volonté de citoyens engagés de proposer une alternative pour la gouvernance 
              de notre commune. Notre programme s'articule autour de valeurs fortes : la solidarité, la transition écologique, 
              la démocratie participative et la transparence.
            </p>
            <p className="text-getigne-700 text-lg">
              Nous croyons qu'une autre façon de faire de la politique est possible, plus proche des citoyens, plus respectueuse 
              de l'environnement et plus attentive aux besoins de chacun. C'est cette vision que nous souhaitons porter 
              pour les élections municipales de 2026.
            </p>
          </div>

          {/* Program sections */}
          <div className="max-w-4xl mx-auto">
            {programSections.map((section, index) => (
              <ProgramSection
                key={index}
                icon={section.icon}
                title={section.title}
                description={section.description}
                points={section.points}
              />
            ))}
          </div>

          {/* Conclusion */}
          <div className="max-w-3xl mx-auto mt-16 pt-10 border-t border-getigne-100">
            <h2 className="text-3xl font-bold mb-6">Notre engagement</h2>
            <p className="text-getigne-700 text-lg mb-4">
              Ce programme a été élaboré à partir de nombreuses rencontres avec les habitants de Gétigné, des associations 
              et des acteurs locaux. Il continuera d'évoluer en fonction de vos contributions et des enjeux qui émergeront 
              d'ici 2026.
            </p>
            <p className="text-getigne-700 text-lg mb-8">
              Nous nous engageons à mettre en œuvre ce programme avec détermination et transparence, en rendant compte 
              régulièrement de nos actions et en restant à l'écoute de tous les habitants.
            </p>
            <div className="bg-getigne-accent/10 p-6 rounded-xl">
              <p className="text-getigne-900 font-medium">
                Vous avez des questions, des suggestions ou souhaitez contribuer à notre programme ?
                N'hésitez pas à nous contacter à <a href="mailto:programme@getigne-collectif.fr" className="text-getigne-accent hover:underline">programme@getigne-collectif.fr</a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProgramPage;

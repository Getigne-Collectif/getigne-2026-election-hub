
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Leaf, Users, Building, Book, Lightbulb, Heart, Shield, BarChart3 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import CitizenCommittees from '@/components/CitizenCommittees';

// Map pour les icônes
const iconMap = {
  Leaf,
  Home: Building,
  Users,
  BarChart3,
  Lightbulb,
  Book,
  Heart,
  Shield
};

const ProgramSection = ({ icon, title, description, points }) => {
  const Icon = iconMap[icon] || Leaf;
  
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
            <p className="text-getigne-800">{point.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ProgramPage = () => {
  const [programSections, setProgramSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchProgramData = async () => {
      try {
        // Récupérer tous les éléments du programme
        const { data: programItems, error: programError } = await supabase
          .from('program_items')
          .select('*')
          .order('title');
        
        if (programError) throw programError;
        
        // Pour chaque élément du programme, récupérer ses points
        const programWithPoints = await Promise.all(
          programItems.map(async (item) => {
            const { data: points, error: pointsError } = await supabase
              .from('program_points')
              .select('*')
              .eq('program_item_id', item.id)
              .order('position');
            
            if (pointsError) throw pointsError;
            
            return {
              ...item,
              points: points
            };
          })
        );
        
        setProgramSections(programWithPoints);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération du programme:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchProgramData();
  }, []);

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
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-16">
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
            {loading ? (
              <div className="text-center py-8">Chargement du programme...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">Une erreur est survenue: {error}</div>
            ) : (
              programSections.map((section, index) => (
                <ProgramSection
                  key={section.id}
                  icon={section.icon}
                  title={section.title}
                  description={section.description}
                  points={section.points}
                />
              ))
            )}
          </div>
        </div>

        {/* Citizen committees section */}
        <CitizenCommittees />

        <div className="container mx-auto px-4 py-16">
          {/* Conclusion */}
          <div className="max-w-3xl mx-auto mt-8 pt-10 border-t border-getigne-100">
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

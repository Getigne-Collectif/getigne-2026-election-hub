
import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Leaf, Home, Users, BarChart3, Lightbulb, Book, Heart, Shield } from 'lucide-react';

// Map pour les icônes
const iconMap = {
  Leaf,
  Home,
  Users,
  BarChart3,
  Lightbulb,
  Book,
  Heart,
  Shield
};

const ProgramItem = ({ icon, title, description, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const Icon = iconMap[icon] || Leaf;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div 
      ref={ref}
      className={`bg-white shadow-sm border border-getigne-100 rounded-xl p-6 hover-lift ${
        isVisible 
          ? 'opacity-100 translate-y-0 transition-all duration-700 ease-out' 
          : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay * 100}ms` }}
    >
      <div className="w-12 h-12 bg-getigne-accent/10 rounded-lg flex items-center justify-center mb-4">
        <Icon className="text-getigne-accent" size={24} />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-getigne-700 mb-4">{description}</p>
      <Link to="/programme" className="text-getigne-accent flex items-center text-sm font-medium group">
        En savoir plus
        <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
};

const Program = () => {
  const [programItems, setProgramItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgramItems = async () => {
      try {
        const { data, error } = await supabase
          .from('program_items')
          .select('*')
          .order('title');
        
        if (error) throw error;
        
        // Limiter à 5 items pour la page d'accueil
        setProgramItems(data.slice(0, 5));
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des éléments du programme:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchProgramItems();
  }, []);

  if (loading) {
    return (
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="container mx-auto">
          <div className="text-center">Chargement des données du programme...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="container mx-auto">
          <div className="text-center text-red-500">Une erreur est survenue: {error}</div>
        </div>
      </section>
    );
  }

  return (
    <section id="programme" className="py-24 px-4 relative overflow-hidden">
      <div className="container mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
            Notre programme
          </span>
          <h2 className="text-4xl font-bold mt-4 mb-6">Des propositions concrètes pour notre commune</h2>
          <p className="text-getigne-700 text-lg">
            Découvrez nos engagements et propositions pour faire de Gétigné une commune où il fait bon vivre, 
            juste, dynamique et tournée vers l'avenir.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programItems.map((item, index) => (
            <ProgramItem 
              key={item.id} 
              icon={item.icon} 
              title={item.title} 
              description={item.description} 
              delay={index}
            />
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-6 mt-10 items-center justify-center">
          <div className="bg-getigne-50 p-6 rounded-xl flex items-center gap-4 max-w-lg w-full">
            <img 
              src="/lovable-uploads/07e7372b-7c2e-4584-9a92-9becd5096172.png" 
              alt="Logo de l'aggloh!" 
              className="w-24 h-auto"
            />
            <div>
              <h3 className="text-lg font-medium mb-1">Gétigné au sein de l'aggloh!</h3>
              <p className="text-getigne-700 text-sm mb-2">
                Découvrez nos propositions pour une meilleure coopération intercommunale.
              </p>
              <Link to="/programme" className="text-getigne-accent flex items-center text-sm font-medium group">
                En savoir plus
                <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <Button 
            asChild
            className="bg-getigne-accent text-white rounded-md hover:bg-getigne-accent/90"
          >
            <Link to="/programme">
              Programme complet
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Program;

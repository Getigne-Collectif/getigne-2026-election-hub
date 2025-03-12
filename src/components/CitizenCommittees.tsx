
import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Bike, Utensils, Music, Leaf } from 'lucide-react';

// Map pour les icônes
const iconMap = {
  Lightbulb,
  Bicycle: Bike, // Replace Bicycle with Bike
  Utensils,
  Music,
  Leaf
};

const CommitteeItem = ({ committee, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const Icon = iconMap[committee.icon] || Leaf;

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
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="w-12 h-12 bg-getigne-accent/10 rounded-lg flex items-center justify-center mb-4">
        <Icon className="text-getigne-accent" size={24} />
      </div>
      <h3 className="text-lg font-medium mb-2">{committee.title}</h3>
      <p className="text-getigne-700 mb-4">{committee.description}</p>
      <Link to={`/commissions/${committee.id}`} className="text-getigne-accent flex items-center text-sm font-medium group">
        En savoir plus
        <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
};

const CitizenCommittees = () => {
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCommittees = async () => {
      try {
        const { data, error } = await supabase
          .from('citizen_committees')
          .select('*')
          .order('title');
        
        if (error) throw error;
        
        setCommittees(data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des commissions:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchCommittees();
  }, []);

  if (loading) {
    return (
      <section id="commissions" className="py-24 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center">Chargement des commissions citoyennes...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="commissions" className="py-24 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center text-red-500">Une erreur est survenue: {error}</div>
        </div>
      </section>
    );
  }

  return (
    <section id="commissions" className="py-24 px-4 bg-white">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
            Démocratie participative
          </span>
          <h2 className="text-4xl font-bold mt-4 mb-6">Nos commissions citoyennes</h2>
          <p className="text-getigne-700 text-lg">
            Depuis mai 2024, des commissions citoyennes travaillent en lien avec nos élus sur des thématiques essentielles pour l'avenir de notre commune.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {committees.map((committee, index) => (
            <CommitteeItem 
              key={committee.id} 
              committee={committee} 
              index={index}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button 
            asChild
            className="bg-getigne-accent text-white rounded-md hover:bg-getigne-accent/90"
          >
            <Link to="/commissions">
              Toutes les commissions
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CitizenCommittees;

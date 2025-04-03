
import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Bike, Utensils, Music, Leaf, Users as UsersIcon } from 'lucide-react';
import { getMemberCount } from './CommitteeMembers';

// Map pour les icônes
const iconMap = {
  'users': UsersIcon,
  'lightbulb': Lightbulb,
  'bike': Bike,
  'bicycle': Bike,
  'utensils': Utensils,
  'music': Music,
  'leaf': Leaf
};

// Fonction pour calculer les classes de couleur basées sur la classe stockée
export const getColorTheme = (colorClass: string | null) => {
  // Valeurs par défaut
  const defaultTheme = {
    bg: 'bg-getigne-50',
    text: 'text-getigne-accent',
    border: 'border-getigne-100',
    hover: 'hover:bg-getigne-100/50',
    accent: 'bg-getigne-accent/10',
    theme: 'Thématique',
    defaultCoverImage: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=2971&q=80',
    defaultTeamImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2970&q=80'
  };

  // Si pas de couleur spécifiée, retourner les valeurs par défaut
  if (!colorClass) return defaultTheme;

  // Extraire la couleur de base de la classe Tailwind (bg-COLOR-500)
  const colorMatch = colorClass.match(/bg-([a-z]+)-\d+/);
  if (!colorMatch || !colorMatch[1]) return defaultTheme;

  const color = colorMatch[1];
  
  // Mapper les couleurs avec leurs thèmes
  const themeMapping = {
    'green': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Environnement',
      defaultCoverImage: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=2971&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1582213782179-e0d4d3cce817?auto=format&fit=crop&w=2970&q=80'
    },
    'blue': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Général',
      defaultCoverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=2970&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=2970&q=80'
    },
    'yellow': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Énergie',
      defaultCoverImage: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=2970&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=2970&q=80'
    },
    'purple': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Mobilité',
      defaultCoverImage: 'https://images.unsplash.com/photo-1519583272095-6433daf26b6e?auto=format&fit=crop&w=2796&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2970&q=80'
    },
    'red': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Urgence',
      defaultCoverImage: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=2971&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2970&q=80'
    },
    'orange': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Alimentation',
      defaultCoverImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2974&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=2970&q=80'
    },
    'indigo': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Culture',
      defaultCoverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=2970&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=2970&q=80'
    },
    'pink': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Social',
      defaultCoverImage: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=2971&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2970&q=80'
    },
    'cyan': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Eau',
      defaultCoverImage: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=2971&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2970&q=80'
    },
    'teal': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Biodiversité',
      defaultCoverImage: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=2971&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1582213782179-e0d4d3cce817?auto=format&fit=crop&w=2970&q=80'
    }
  };

  return themeMapping[color] || defaultTheme;
};

const CommitteeItem = ({ committee, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const ref = useRef(null);
  
  // Récupérer l'icône correspondante ou utiliser UsersIcon par défaut
  const iconKey = committee.icon ? committee.icon.toLowerCase() : 'users';
  const Icon = iconMap[iconKey] || UsersIcon;
  
  // Récupérer les couleurs spécifiques à cette commission basées sur la propriété color
  const themeColor = getColorTheme(committee.color);

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

  useEffect(() => {
    const fetchMemberCount = async () => {
      const count = await getMemberCount(committee.id);
      setMemberCount(count);
    };

    fetchMemberCount();
  }, [committee.id]);

  return (
    <Link to={`/commissions/${committee.id}`} className="block">
      <div 
        ref={ref}
        className={`bg-white shadow-sm border ${themeColor.border} rounded-xl p-6 hover-lift transition-all duration-200 ${
          isVisible 
            ? 'opacity-100 translate-y-0 transition-all duration-700 ease-out' 
            : 'opacity-0 translate-y-10'
        }`}
        style={{ transitionDelay: `${index * 100}ms` }}
      >
        <div className={`w-12 h-12 ${themeColor.accent} rounded-lg flex items-center justify-center mb-4`}>
          <Icon className={themeColor.text} size={24} />
        </div>
        <span className={`text-xs ${themeColor.text} ${themeColor.bg} px-2 py-0.5 rounded-full inline-block mb-2`}>
          {themeColor.theme}
        </span>
        <h3 className="text-lg font-medium mb-2">{committee.title}</h3>
        <p className="text-getigne-700 mb-2 line-clamp-2">{committee.description}</p>
        
        <div className="flex items-center text-getigne-500 text-sm mb-3">
          <Users size={16} className="mr-1" />
          <span>{memberCount} {memberCount > 1 ? 'membres' : 'membre'}</span>
        </div>
        
        <div className={`${themeColor.text} flex items-center text-sm font-medium group`}>
          En savoir plus
          <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
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

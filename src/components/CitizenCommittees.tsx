
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

// Map pour les couleurs des thèmes
const colorMap = {
  'bg-green-500': {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    accent: 'bg-green-400/10',
    theme: 'Environnement'
  },
  'bg-blue-500': {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    accent: 'bg-blue-400/10',
    theme: 'Général'
  },
  'bg-yellow-500': {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    border: 'border-yellow-200',
    accent: 'bg-yellow-400/10',
    theme: 'Énergie'
  },
  'bg-purple-500': {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    accent: 'bg-purple-400/10',
    theme: 'Mobilité'
  },
  'bg-red-500': {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    accent: 'bg-red-400/10',
    theme: 'Urgence'
  },
  'bg-orange-500': {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    accent: 'bg-orange-400/10',
    theme: 'Alimentation'
  },
  'bg-indigo-500': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-200',
    accent: 'bg-indigo-400/10',
    theme: 'Culture'
  },
  'bg-pink-500': {
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    border: 'border-pink-200',
    accent: 'bg-pink-400/10',
    theme: 'Social'
  },
  'bg-cyan-500': {
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
    border: 'border-cyan-200',
    accent: 'bg-cyan-400/10',
    theme: 'Eau'
  },
  'bg-teal-500': {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    border: 'border-teal-200',
    accent: 'bg-teal-400/10',
    theme: 'Biodiversité'
  }
};

const CommitteeItem = ({ committee, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const ref = useRef(null);
  
  // Récupérer l'icône correspondante ou utiliser UsersIcon par défaut
  const iconKey = committee.icon ? committee.icon.toLowerCase() : 'users';
  const Icon = iconMap[iconKey] || UsersIcon;
  
  // Récupérer les couleurs spécifiques à cette commission basées sur la propriété color
  const themeColor = committee.color && colorMap[committee.color] 
    ? colorMap[committee.color] 
    : {
        bg: 'bg-getigne-50',
        text: 'text-getigne-accent',
        border: 'border-getigne-100',
        accent: 'bg-getigne-accent/10',
        theme: 'Thématique'
      };

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
        className={`bg-white shadow-sm border ${themeColor.border} rounded-xl p-6 hover-lift ${
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
        <p className="text-getigne-700 mb-2">{committee.description}</p>
        
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


import { useState, useEffect, useRef } from 'react';
import { User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

const getAge = (birthDate) => {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
};

const TeamMember = ({ member, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const age = getAge(member.birth_date);
  const profession = member.profession?.trim();
  const metaParts = [
    age !== null ? `${age} ans` : null,
    profession || null,
  ].filter(Boolean);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
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
      className={`bg-white rounded-xl overflow-hidden shadow-sm border border-getigne-100 hover-lift ${
        isVisible 
          ? 'opacity-100 translate-y-0 transition-all duration-700 ease-out' 
          : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="h-64 overflow-hidden">
        <img 
          src={member.image} 
          alt={member.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
      <div className="p-6">
        <h3 className="font-medium text-xl mb-2">{member.name}</h3>
        <div className="text-getigne-700 text-sm">
          {metaParts.length > 0 ? metaParts.join(' · ') : 'Âge et profession non renseignés'}
        </div>
      </div>
    </div>
  );
};

const Team = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*');
        
        if (error) throw error;
        
        setTeamMembers(data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des membres de l\'équipe:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  if (loading) {
    return (
      <section id="equipe" className="py-24 px-4 bg-getigne-50">
        <div className="container mx-auto">
          <div className="text-center">Chargement des membres de l'équipe...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="equipe" className="py-24 px-4 bg-getigne-50">
        <div className="container mx-auto">
          <div className="text-center text-red-500">Une erreur est survenue: {error}</div>
        </div>
      </section>
    );
  }

  return (
    <section id="equipe" className="py-24 px-4 bg-getigne-50">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
            Notre équipe
          </span>
          <h2 className="text-4xl font-bold mt-4 mb-6">Les membres du collectif</h2>
          <p className="text-getigne-700 text-lg">
            Découvrez les personnes engagées qui portent le projet pour les élections municipales de 2026.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
          {teamMembers.map((member, index) => (
            <TeamMember key={member.id} member={member} index={index} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button 
            asChild
            className="bg-getigne-accent text-white rounded-md hover:bg-getigne-accent/90"
          >
            <Link to="/qui-sommes-nous">
              En savoir plus sur le collectif
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Team;

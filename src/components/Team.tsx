
import { useState, useEffect, useRef } from 'react';
import { User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Dummy team data
const teamMembers = [
  {
    id: 1,
    name: "Marie Dubois",
    role: "Porte-parole",
    bio: "Engagée dans la vie associative depuis 15 ans, Marie souhaite mettre son expérience au service de la commune.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    name: "Thomas Martin",
    role: "Coordinateur",
    bio: "Ingénieur en environnement, Thomas est spécialisé dans les questions de transition écologique et de développement durable.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    name: "Sophie Bernard",
    role: "Trésorière",
    bio: "Comptable de profession, Sophie veille à la transparence et à la bonne gestion des ressources du collectif.",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    name: "Lucas Petit",
    role: "Chargé de communication",
    bio: "Graphiste et communicant, Lucas met ses compétences au service de la visibilité de notre collectif.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
];

const TeamMember = ({ member, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

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
        <h3 className="font-medium text-xl mb-1">{member.name}</h3>
        <div className="text-getigne-accent font-medium text-sm mb-3">{member.role}</div>
        <p className="text-getigne-700 mb-4">{member.bio}</p>
      </div>
    </div>
  );
};

const Team = () => {
  return (
    <section id="equipe" className="py-24 px-4 bg-getigne-50">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
            Notre équipe
          </span>
          <h2 className="text-4xl font-bold mt-4 mb-6">Les membres du collectif</h2>
          <p className="text-getigne-700 text-lg">
            Découvrez les personnes engagées qui portent le projet de Gétigné Collectif pour les élections municipales de 2026.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {teamMembers.map((member, index) => (
            <TeamMember key={member.id} member={member} index={index} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button 
            asChild
            className="bg-getigne-accent text-white rounded-md hover:bg-getigne-accent/90"
          >
            <Link to="/equipe">
              L'équipe complète
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Team;

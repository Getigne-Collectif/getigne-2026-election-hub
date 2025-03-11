
import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Leaf, Home, Users, BarChart3, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ProgramItem = ({ icon: Icon, title, description, delay }) => {
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
  const programItems = [
    {
      icon: Leaf,
      title: "Transition écologique",
      description: "Des mesures concrètes pour une commune plus verte et responsable face aux défis climatiques.",
    },
    {
      icon: Home,
      title: "Cadre de vie",
      description: "Aménagements urbains et développement de services pour améliorer la qualité de vie à Gétigné.",
    },
    {
      icon: Users,
      title: "Solidarité & Inclusion",
      description: "Des initiatives pour ne laisser personne de côté et renforcer le lien social entre tous les habitants.",
    },
    {
      icon: BarChart3,
      title: "Économie locale",
      description: "Soutien aux commerces de proximité et développement des ressources économiques locales.",
    },
    {
      icon: Lightbulb,
      title: "Démocratie participative",
      description: "Impliquer les citoyens dans les décisions avec des outils de consultation et de co-construction.",
    }
  ];

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
              key={index} 
              icon={item.icon} 
              title={item.title} 
              description={item.description} 
              delay={index}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
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


import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center px-4 py-20 overflow-hidden">
      {/* Background circle */}
      <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-getigne-100 blur-3xl opacity-70" />
      <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-getigne-accent/10 blur-3xl opacity-70" />
      
      <div className="container mx-auto relative z-10">
        <div 
          className={`max-w-4xl mx-auto text-center transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className={`mb-4 inline-block transform transition-all duration-700 delay-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            <span className="text-getigne-accent bg-getigne-accent/10 px-4 py-1 rounded-full text-sm font-medium">
              Élections municipales 2026
            </span>
          </div>

          <h1 
            className={`text-5xl md:text-7xl font-bold mb-6 tracking-tight transform transition-all duration-700 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
          >
            Ensemble, construisons
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-getigne-accent to-blue-400 block">
              l'avenir de Gétigné
            </span>
          </h1>

          <p 
            className={`text-lg md:text-xl text-getigne-700 mb-10 max-w-3xl mx-auto transform transition-all duration-700 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
          >
            Un collectif citoyen engagé pour une commune plus solidaire, 
            écologique et participative au service de toutes et tous.
          </p>

          <div 
            className={`flex flex-col sm:flex-row gap-4 justify-center transform transition-all duration-700 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
          >
            <Button className="bg-getigne-accent hover:bg-getigne-accent/90 text-white py-6 px-8 rounded-md text-lg">
              Découvrir notre programme
            </Button>
            <Button variant="outline" className="border-getigne-200 hover:bg-getigne-100 py-6 px-8 rounded-md text-lg">
              Nous rejoindre
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-background/50 pointer-events-none" />
    </section>
  );
};

export default Hero;

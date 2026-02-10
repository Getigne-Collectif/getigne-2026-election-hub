import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Routes } from '@/routes';
import { useAppSettings } from '@/hooks/useAppSettings';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { settings } = useAppSettings();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center px-4 py-20 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <img
          src={settings.branding.images.hero}
          alt={`Visuel ${settings.branding.name}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-getigne-800/60 to-getigne-800/20 backdrop-blur-sm"></div>
      </div>

      {/* Semi-transparent shapes */}
      <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-getigne-green-500/20 blur-3xl opacity-70 animate-pulse" />
      <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-getigne-green-100/20 blur-3xl opacity-70" />

      <div className="container mx-auto relative z-10">
        <div
          className={` mx-auto text-center transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className={`mb-4 inline-block transform transition-all duration-700 delay-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            <span className="text-white bg-getigne-green-500/30 px-5 py-2 rounded-full text-base font-medium">
              Élections municipales 2026
            </span>
          </div>

          <h1
            className={`text-4xl md:text-7xl font-bold mb-6 tracking-tight transform transition-all duration-700 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} text-white`}
          >
            {settings.content.heroTitle}<br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-white to-yellow-300 block">
            {settings.content.heroTitleEmphasis}
            </span>
            {settings.content.heroTitleSuffix}
          </h1>

          <p
            className={`hidden md:inline text-lg font-bold md:text-xl text-white mb-12 max-w-3xl mx-auto transform transition-all duration-700 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
          >
            {settings.content.heroSubtitle}
          </p>

          <div
            className={`flex flex-col mt-8 sm:flex-row gap-4 justify-center transform transition-all duration-700 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
          >
            <Button asChild className="bg-getigne-green-600 hover:bg-getigne-green-700 text-white py-6 px-8 rounded-md text-lg shadow-lg hover:shadow-xl transition-all duration-300">
              <Link to={Routes.PROGRAM}>
                Découvrez notre projet <span className="hidden md:inline">pour 2026</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-getigne-800/70 pointer-events-none" />
    </section>
  );
};

export default Hero;

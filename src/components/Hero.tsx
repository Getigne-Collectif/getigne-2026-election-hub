
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center px-4 py-20 overflow-hidden">
      {/* Background circle */}
      <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-getigne-100 blur-3xl opacity-70" />
      <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-getigne-accent/10 blur-3xl opacity-70" />
      
      <div className="container mx-auto relative z-10">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="mb-4 inline-block">
            <span className="text-getigne-accent bg-getigne-accent/10 px-4 py-1 rounded-full text-sm font-medium">
              Élections municipales 2026
            </span>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
          >
            Ensemble, construisons
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-getigne-accent to-blue-400 block">
              l'avenir de Gétigné
            </span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-getigne-700 mb-10 max-w-3xl mx-auto"
          >
            Un collectif citoyen engagé pour une commune plus solidaire, 
            écologique et participative au service de toutes et tous.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button className="bg-getigne-accent hover:bg-getigne-accent/90 text-white py-6 px-8 rounded-md text-lg">
              Découvrir notre programme
            </Button>
            <Button variant="outline" className="border-getigne-200 hover:bg-getigne-100 py-6 px-8 rounded-md text-lg">
              Nous rejoindre
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-background/50 pointer-events-none" />
    </section>
  );
};

export default Hero;

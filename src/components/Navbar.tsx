
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const routes = [
  { name: 'Accueil', path: '/', exact: true },
  { name: 'Programme', path: '/programme' },
  { name: 'Actualités', path: '/actualites' },
  { name: 'Événements', path: '/evenements' },
  { name: 'Commissions', path: '/commissions' },
  { name: 'Adhérer', path: '/adherer' },
  { name: 'Contact', path: '/contact' }
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-white/80 backdrop-blur-md py-3'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-getigne-900 font-medium text-xl flex items-center gap-2"
          >
            <img 
              src="/lovable-uploads/ef5618c7-2730-4f0e-bccf-554d89c7ff53.png" 
              alt="Gétigné Collectif" 
              className="h-10"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {routes.map(route => (
              <Link 
                key={route.path} 
                to={route.path} 
                className={`text-getigne-800 hover:text-getigne-accent py-1 px-2 text-sm font-medium transition-colors ${
                  location.pathname === route.path ? 'text-getigne-accent' : ''
                }`}
              >
                {route.name}
              </Link>
            ))}
            <Button 
              asChild
              className="bg-getigne-accent text-white rounded-full hover:bg-getigne-accent/90 ml-2"
            >
              <Link to="/contact">
                Nous rejoindre
              </Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button 
              asChild
              className="bg-getigne-accent text-white rounded-full hover:bg-getigne-accent/90 mr-4"
              size="sm"
            >
              <Link to="/contact">
                Rejoindre
              </Link>
            </Button>
            <button
              className="text-getigne-900"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`fixed inset-0 z-40 bg-white transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden`}
      >
        <div className="container pt-20 px-4">
          <nav className="flex flex-col space-y-6">
            {routes.map(route => (
              <Link 
                key={route.path} 
                to={route.path} 
                className={`text-getigne-800 text-lg font-medium hover:text-getigne-accent ${
                  location.pathname === route.path ? 'text-getigne-accent' : ''
                }`}
                onClick={() => setIsOpen(false)}
              >
                {route.name}
              </Link>
            ))}
            <Button 
              asChild
              className="bg-getigne-accent text-white rounded-full hover:bg-getigne-accent/90 w-full"
            >
              <Link to="/contact" onClick={() => setIsOpen(false)}>
                Nous rejoindre
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

import { useState, useEffect } from 'react';
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
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 glass py-2"
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
          <nav className="hidden md:flex items-center space-x-8">
            {routes.map(route => (
              <Link key={route.path} to={route.path} className="text-getigne-800 hover:text-getigne-accent animated-underline py-1">
                {route.name}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-getigne-900"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`fixed inset-0 z-40 glass pt-16 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden`}
      >
        <nav className="container flex flex-col items-center justify-center h-full gap-8 text-lg">
          {routes.map(route => (
            <Link key={route.path} to={route.path} className="text-getigne-800 hover:text-getigne-accent py-2 w-full text-center" onClick={() => setIsOpen(false)}>
              {route.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

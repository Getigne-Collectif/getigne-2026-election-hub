
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
        isScrolled ? 'glass py-2' : 'py-4 bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-getigne-900 font-medium text-xl flex items-center gap-2"
          >
            <span className="text-getigne-accent">Gétigné</span> Collectif
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-getigne-800 hover:text-getigne-accent animated-underline py-1">
              Accueil
            </Link>
            <Link to="/programme" className="text-getigne-800 hover:text-getigne-accent animated-underline py-1">
              Programme
            </Link>
            <Link to="/actualites" className="text-getigne-800 hover:text-getigne-accent animated-underline py-1">
              Actualités
            </Link>
            <Link to="/evenements" className="text-getigne-800 hover:text-getigne-accent animated-underline py-1">
              Événements
            </Link>
            <Link to="/equipe" className="text-getigne-800 hover:text-getigne-accent animated-underline py-1">
              Notre équipe
            </Link>
            <Button className="bg-getigne-accent text-white hover:bg-getigne-accent/80">
              Nous contacter
            </Button>
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
          <Link to="/" className="text-getigne-800 hover:text-getigne-accent py-2 w-full text-center" onClick={() => setIsOpen(false)}>
            Accueil
          </Link>
          <Link to="/programme" className="text-getigne-800 hover:text-getigne-accent py-2 w-full text-center" onClick={() => setIsOpen(false)}>
            Programme
          </Link>
          <Link to="/actualites" className="text-getigne-800 hover:text-getigne-accent py-2 w-full text-center" onClick={() => setIsOpen(false)}>
            Actualités
          </Link>
          <Link to="/evenements" className="text-getigne-800 hover:text-getigne-accent py-2 w-full text-center" onClick={() => setIsOpen(false)}>
            Événements
          </Link>
          <Link to="/equipe" className="text-getigne-800 hover:text-getigne-accent py-2 w-full text-center" onClick={() => setIsOpen(false)}>
            Notre équipe
          </Link>
          <Button className="bg-getigne-accent text-white hover:bg-getigne-accent/80 mt-4 w-64">
            Nous contacter
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

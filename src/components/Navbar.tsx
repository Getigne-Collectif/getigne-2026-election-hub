
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronDown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import AuthButton from './AuthButton';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path
      ? 'text-getigne-accent'
      : 'text-getigne-700 hover:text-getigne-accent transition-colors duration-200';
  };

  const NavLinks = () => (
    <>
      <li>
        <Link to="/" className={isActive('/')}>
          Accueil
        </Link>
      </li>
      <li>
        <Link to="/programme" className={isActive('/programme')}>
          Notre programme
        </Link>
      </li>
      <li>
        <Link to="/actualites" className={isActive('/actualites')}>
          Actualités
        </Link>
      </li>
      <li>
        <Link to="/agenda" className={isActive('/agenda')}>
          Agenda
        </Link>
      </li>
      <li className="relative group">
        <div className="flex items-center cursor-pointer">
          <span
            className={
              isActive('/equipe') ||
              isActive('/commissions') ||
              isActive('/qui-sommes-nous')
                ? 'text-getigne-accent'
                : 'text-getigne-700 group-hover:text-getigne-accent transition-colors duration-200'
            }
          >
            Le collectif
          </span>
          <ChevronDown
            size={16}
            className="ml-1 transition-transform group-hover:rotate-180"
          />
        </div>
        <ul className="absolute left-0 mt-2 bg-white shadow-md rounded-md py-2 w-48 z-10 hidden group-hover:block">
          <li className="px-4 py-2 hover:bg-getigne-50">
            <Link to="/equipe" className="block">
              Notre équipe
            </Link>
          </li>
          <li className="px-4 py-2 hover:bg-getigne-50">
            <Link to="/commissions" className="block">
              Commissions citoyennes
            </Link>
          </li>
          <li className="px-4 py-2 hover:bg-getigne-50">
            <Link to="/qui-sommes-nous" className="block">
              Qui sommes-nous ?
            </Link>
          </li>
        </ul>
      </li>
      <li>
        <Link to="/adherer" className={isActive('/adherer')}>
          Adhérer
        </Link>
      </li>
    </>
  );

  return (
    <header
      className={`fixed w-full top-0 left-0 z-50 py-3 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-white/90 backdrop-blur-md'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img
              src="/lovable-uploads/ef5618c7-2730-4f0e-bccf-554d89c7ff53.png"
              alt="Gétigné Collectif"
              className="h-10"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-8 items-center">
              <NavLinks />
            </ul>
          </nav>

          <div className="flex items-center space-x-4">
            <AuthButton />

            {/* Mobile Navigation */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="mt-8">
                  <ul className="space-y-6 text-lg">
                    <NavLinks />
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;


import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

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

  const handleLogoClick = () => {
    // Scroll to top when logo is clicked
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
            onClick={handleLogoClick}
          >
            <img 
              src="/lovable-uploads/ef5618c7-2730-4f0e-bccf-554d89c7ff53.png" 
              alt="Gétigné Collectif" 
              className="h-10"
            />
          </Link>

          {/* Desktop Navigation with Dropdowns */}
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/" className="text-getigne-800 hover:text-getigne-accent py-1 px-4 text-sm font-medium transition-colors">
                    Accueil
                  </Link>
                </NavigationMenuItem>

                {/* Programme dropdown with Commissions */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-getigne-800 hover:text-getigne-accent py-1 text-sm font-medium transition-colors bg-transparent">
                    Programme
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-3 p-4">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            to="/programme" 
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-getigne-accent/10 hover:text-getigne-accent focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium">Notre programme</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Nos valeurs et nos engagements
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            to="/commissions" 
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-getigne-accent/10 hover:text-getigne-accent focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium">Commissions citoyennes</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Travaux et membres des commissions
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Actualités dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-getigne-800 hover:text-getigne-accent py-1 text-sm font-medium transition-colors bg-transparent">
                    Actualités
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-3 p-4">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            to="/actualites" 
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-getigne-accent/10 hover:text-getigne-accent focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium">Toutes les actualités</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Dernières nouvelles du collectif
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            to="/evenements" 
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-getigne-accent/10 hover:text-getigne-accent focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium">Événements</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Nos prochains rendez-vous
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/equipe" className="text-getigne-800 hover:text-getigne-accent py-1 px-4 text-sm font-medium transition-colors">
                    Équipe
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/adherer" className="text-getigne-800 hover:text-getigne-accent py-1 px-4 text-sm font-medium transition-colors">
                    Rejoignez le mouvement
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link to="/adherer#contact" className="text-getigne-800 hover:text-getigne-accent py-1 px-4 text-sm font-medium transition-colors">
                    Contact
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button 
              asChild
              className="bg-getigne-accent text-white rounded-full hover:bg-getigne-accent/90 mr-4"
              size="sm"
            >
              <Link to="/adherer">
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
            <Link 
              to="/" 
              className="text-getigne-800 text-lg font-medium hover:text-getigne-accent"
            >
              Accueil
            </Link>
            
            <div>
              <button 
                className="text-getigne-800 text-lg font-medium hover:text-getigne-accent flex items-center"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById('mobile-programme-submenu');
                  if (el) el.classList.toggle('hidden');
                }}
              >
                Programme <ChevronDown size={16} className="ml-1" />
              </button>
              <div id="mobile-programme-submenu" className="hidden pl-4 mt-2 space-y-2">
                <Link 
                  to="/programme" 
                  className="block py-1 text-getigne-700 hover:text-getigne-accent"
                >
                  Notre programme
                </Link>
                <Link 
                  to="/commissions" 
                  className="block py-1 text-getigne-700 hover:text-getigne-accent"
                >
                  Commissions citoyennes
                </Link>
              </div>
            </div>
            
            <div>
              <button 
                className="text-getigne-800 text-lg font-medium hover:text-getigne-accent flex items-center"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById('mobile-actualites-submenu');
                  if (el) el.classList.toggle('hidden');
                }}
              >
                Actualités <ChevronDown size={16} className="ml-1" />
              </button>
              <div id="mobile-actualites-submenu" className="hidden pl-4 mt-2 space-y-2">
                <Link 
                  to="/actualites" 
                  className="block py-1 text-getigne-700 hover:text-getigne-accent"
                >
                  Toutes les actualités
                </Link>
                <Link 
                  to="/evenements" 
                  className="block py-1 text-getigne-700 hover:text-getigne-accent"
                >
                  Événements
                </Link>
              </div>
            </div>

            <Link 
              to="/equipe" 
              className="text-getigne-800 text-lg font-medium hover:text-getigne-accent"
            >
              Équipe
            </Link>
            
            <Link 
              to="/adherer" 
              className="text-getigne-800 text-lg font-medium hover:text-getigne-accent"
            >
              Rejoignez le mouvement
            </Link>
            
            <Link 
              to="/adherer#contact" 
              className="text-getigne-800 text-lg font-medium hover:text-getigne-accent"
            >
              Contact
            </Link>
            
            <Button 
              asChild
              className="bg-getigne-accent text-white rounded-full hover:bg-getigne-accent/90 w-full mt-4"
            >
              <Link to="/adherer">
                Rejoignez le mouvement
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

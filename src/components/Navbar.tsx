
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronDown, Settings, FileText, Car, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AuthButton from './AuthButton';
import { useAuth } from '@/context/auth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Routes } from '@/routes';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { isAdmin, user, refreshUserRoles, userRoles, isRefreshingRoles } = useAuth();
  const [hasRefreshedRoles, setHasRefreshedRoles] = useState(false);
  const { settings } = useAppSettings();

  // Détermine si l'utilisateur peut accéder au programme
  const canAccessProgram = 
    settings.showProgram || 
    userRoles.includes('admin') || 
    userRoles.includes('program_manager');

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

  useEffect(() => {
    // Ne pas re-vérifier les rôles automatiquement dans la navbar
    // Cela peut causer des redirections intempestives lors du changement d'onglet
    // Les rôles sont déjà gérés par AuthProvider lors du refresh de token
    if (user && !hasRefreshedRoles) {
      setHasRefreshedRoles(true);
    }
  }, [user, hasRefreshedRoles]);

  useEffect(() => {
    if (user === null) {
      setHasRefreshedRoles(false);
    }
  }, [user]);

  const NavLinks = () => (
    <>
      <li>
        <Link to={Routes.HOME} className={isActive(Routes.HOME)}>
          Accueil
        </Link>
      </li>
      <li>
        <Link
          to={Routes.PROGRAM}
          className={
            isActive(Routes.PROGRAM)
              ? 'text-getigne-accent'
              : 'text-getigne-700 group-hover:text-getigne-accent transition-colors duration-200'
          }
        >
          Le programme
        </Link>
      </li>
      <li>
        <Link to={Routes.NEWS} className={isActive(Routes.NEWS)}>
          Actualités
        </Link>
      </li>
      <li className="relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className={`flex items-center ${
                location.pathname === Routes.AGENDA || location.pathname === Routes.NEIGHBORHOOD_EVENTS 
                  ? 'text-getigne-accent' 
                  : 'text-getigne-700 hover:text-getigne-accent transition-colors duration-200'
              }`}
            >
              Agenda
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem asChild>
              <Link to={Routes.AGENDA} className="w-full flex items-center">
                Tous les événements
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={Routes.NEIGHBORHOOD_EVENTS} className="w-full flex items-center">
                <Coffee className="mr-2 h-4 w-4" />
                Cafés de quartier
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
      
      <li>
        <Link to={Routes.JOIN} className={isActive(Routes.JOIN)}>
          Adhérer
        </Link>
      </li>
      <li>
        <Link to={Routes.CONTACT} className={isActive(Routes.CONTACT)}>
          Contact
        </Link>
      </li>
    </>
  );

  const AdminLinks = () => {
    if (!isAdmin && !isRefreshingRoles) return null;
    if (!isAdmin && isRefreshingRoles && userRoles.length === 0) return null;

    return (
      <>
        <li className="pt-2 pb-2 border-t border-gray-200 mt-4">
          <span className="text-sm text-muted-foreground">Administration</span>
        </li>
        <li>
          <Link to={Routes.ADMIN} className={isActive(Routes.ADMIN)}>
            Dashboard
          </Link>
        </li>
        <li>
          <Link to={Routes.ADMIN_PAGES} className={isActive(Routes.ADMIN_PAGES)}>
            Pages
          </Link>
        </li>
        <li>
          <Link to={Routes.ADMIN_MENU} className={isActive(Routes.ADMIN_MENU)}>
            Menu
          </Link>
        </li>
      </>
    );
  };

  return (
    <header
      className={`fixed w-full top-0 left-0 z-50 py-3 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-white/90 backdrop-blur-md'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to={Routes.HOME} className="flex items-center">
            <img
              src="/images/getigne-collectif-logo.png"
              alt="Gétigné Collectif"
              className="h-10"
            />
          </Link>

          <nav className="hidden md:block">
            <ul className="flex space-x-8 items-center">
              <NavLinks />
            </ul>
          </nav>

          <div className="flex items-center space-x-4">
            <AuthButton />

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
                    <AdminLinks />
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

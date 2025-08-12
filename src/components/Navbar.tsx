
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronDown, Settings, FileText, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import AuthButton from './AuthButton';
import { useAuth } from '@/context/AuthContext';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Routes } from '@/routes';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { isAdmin, user, refreshUserRoles, userRoles } = useAuth();
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
    if (user && !hasRefreshedRoles) {
      console.log('Navbar admin status check:', { isAdmin, userId: user.id });
      refreshUserRoles();
      setHasRefreshedRoles(true);
    }
  }, [user, refreshUserRoles, isAdmin, hasRefreshedRoles]);

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
      <li>
        <Link to={Routes.AGENDA} className={isActive(Routes.AGENDA)}>
          Agenda
        </Link>
      </li>
      {user && (
        <li>
          <Link to={Routes.LIFT} className={isActive(Routes.LIFT)}>
            <Car className="inline-block w-4 h-4 mr-1" />
            Lift
          </Link>
        </li>
      )}
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
    if (!isAdmin) return null;

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

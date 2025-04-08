
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronDown, Settings, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import AuthButton from './AuthButton';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { isAdmin, user, refreshUserRoles, userRoles } = useAuth();
  const [hasRefreshedRoles, setHasRefreshedRoles] = useState(false);

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
        <Link to="/" className={isActive('/')}>
          Accueil
        </Link>
      </li>
      <li>
        <Link
          to="/objectif-2026"
          className={
            isActive('/objectif-2026') ||
            isActive('/objectif-2026/programme')
              ? 'text-getigne-accent'
              : 'text-getigne-700 group-hover:text-getigne-accent transition-colors duration-200'
          }
        >
          Objectif 2026
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
      <li>
        <Link to="/qui-sommes-nous" className={isActive('/qui-sommes-nous')}>
          Qui sommes-nous ?
        </Link>
      </li>
      <li>
        <Link to="/adherer" className={isActive('/adherer')}>
          Adhérer
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
          <Link to="/admin" className={isActive('/admin')}>
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/admin/pages" className={isActive('/admin/pages')}>
            Pages
          </Link>
        </li>
        <li>
          <Link to="/admin/menu" className={isActive('/admin/menu')}>
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
          <Link to="/" className="flex items-center">
            <img
              src="/lovable-uploads/ef5618c7-2730-4f0e-bccf-554d89c7ff53.png"
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

            {userRoles.includes('admin') && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                aria-label="Administration"
                asChild
              >
                <Link to="/admin">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
            )}

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

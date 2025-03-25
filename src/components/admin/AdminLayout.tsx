
import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Separator } from "@/components/ui/separator";
import { cn } from '@/lib/utils';
import { FileText, Menu as MenuIcon } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  const navItems = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Utilisateurs', path: '/admin/users' },
    { label: 'Actualités', path: '/admin/news' },
    { label: 'Événements', path: '/admin/events' },
    { label: 'Pages', path: '/admin/pages', icon: <FileText className="mr-2 h-4 w-4" /> },
    { label: 'Menu', path: '/admin/menu', icon: <MenuIcon className="mr-2 h-4 w-4" /> },
    { label: 'Paramètres', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-64 shrink-0">
              <div className="py-4">
                <h2 className="text-lg font-bold mb-4">Administration</h2>
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "block px-3 py-2 rounded-md transition-colors flex items-center",
                        location.pathname === item.path
                          ? "bg-getigne-100 text-getigne-900 font-medium"
                          : "hover:bg-getigne-50 text-getigne-700"
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
            <Separator orientation="vertical" className="hidden md:block" />
            <div className="flex-1">
              {children}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminLayout;

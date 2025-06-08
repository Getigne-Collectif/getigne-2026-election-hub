import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Users, 
  Pages,
  Menu,
  Star,
  BookOpen,
  FolderOpen,
  Settings,
  ArrowLeft
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();

  const menuItems = [
    {
      title: 'Vue d\'ensemble',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      title: 'Actualités',
      href: '/admin/news',
      icon: FileText,
    },
    {
      title: 'Événements',
      href: '/admin/events',
      icon: Calendar,
    },
    {
      title: 'Utilisateurs',
      href: '/admin/users',
      icon: Users,
    },
    {
      title: 'Pages',
      href: '/admin/pages',
      icon: Pages,
    },
    {
      title: 'Menu',
      href: '/admin/menu',
      icon: Menu,
    },
    {
      title: 'Galaxy',
      href: '/admin/galaxy',
      icon: Star,
    },
    {
      title: 'Comités citoyens',
      href: '/admin/committees',
      icon: Users,
    },
    {
      title: 'Programme',
      href: '/admin/program',
      icon: BookOpen,
    },
    {
      title: 'Projets',
      href: '/admin/projects',
      icon: FolderOpen,
    },
    {
      title: 'Paramètres',
      href: '/admin/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft size={16} />
            Retour au site
          </Link>
          <h2 className="text-xl font-bold text-gray-900 mt-4">Administration</h2>
        </div>
        
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="px-3 pb-6">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || 
                  (item.href !== '/admin' && location.pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors
                      ${isActive 
                        ? 'bg-getigne-green-100 text-getigne-green-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon size={18} />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

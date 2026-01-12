import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Users, 
  Menu,
  Star,
  BookOpen,
  FolderOpen,
  Settings,
  ArrowLeft,
  UserCircle,
  ListChecks,
  ChevronDown,
  ChevronRight,
  Menu as MenuIcon,
  X,
  FileText as FileTextIcon,
  Users as UsersIcon,
  Settings as SettingsIcon,
  HelpCircle
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  breadcrumb?: React.ReactNode;
  backLink?: React.ReactNode;
  noContainer?: boolean;
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<any>;
}

interface MenuSection {
  title: string;
  icon: React.ComponentType<any>;
  color: 'blue' | 'purple' | 'emerald';
  items: MenuItem[];
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, description, breadcrumb, backLink, noContainer = false }) => {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    contenu: true,
    personnes: true,
    structure: true,
  });

  const menuSections: MenuSection[] = [
    {
      title: 'Contenu',
      icon: FileTextIcon,
      color: 'blue',
      items: [
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
          title: 'Comités citoyens',
          href: '/admin/committees',
          icon: Users,
        },
        {
          title: 'Lexique',
          href: '/admin/lexicon',
          icon: BookOpen,
        },
        {
          title: 'FAQ',
          href: '/admin/faq',
          icon: HelpCircle,
        },
      ],
    },
    {
      title: 'Personnes',
      icon: UsersIcon,
      color: 'purple',
      items: [
        {
          title: 'Utilisateurs',
          href: '/admin/users',
          icon: Users,
        },
        {
          title: 'Membres de l\'équipe',
          href: '/admin/team-members',
          icon: UserCircle,
        },
        {
          title: 'Liste électorale',
          href: '/admin/electoral-list',
          icon: ListChecks,
        },
        {
          title: 'Comité de soutien',
          href: '/admin/comite-de-soutien',
          icon: Users,
        },
      ],
    },
    {
      title: 'Structure',
      icon: SettingsIcon,
      color: 'emerald',
      items: [
        {
          title: 'Paramètres',
          href: '/admin/settings',
          icon: Settings,
        },
        {
          title: 'Galaxy',
          href: '/admin/galaxy',
          icon: Star,
        },
        {
          title: 'Menu',
          href: '/admin/menu',
          icon: Menu,
        },
        {
          title: 'Pages',
          href: '/admin/pages',
          icon: FileText,
        },
      ],
    },
  ];

  const toggleSection = (sectionKey: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { text: string; bg: string }> = {
      blue: { text: 'text-blue-600', bg: 'bg-blue-100' },
      purple: { text: 'text-purple-600', bg: 'bg-purple-100' },
      emerald: { text: 'text-emerald-600', bg: 'bg-emerald-100' },
    };
    return colorMap[color] || colorMap.emerald;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`
        bg-white shadow-lg border-r transition-all duration-300 relative
        ${isSidebarCollapsed ? 'w-16' : 'w-72'}
      `}>
        {/* Header avec logo */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && (
              <Link to="/" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft size={16} />
                <span>Retour au site</span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              aria-label={isSidebarCollapsed ? 'Développer le menu' : 'Réduire le menu'}
            >
              {isSidebarCollapsed ? <MenuIcon size={20} /> : <X size={20} />}
            </Button>
          </div>
          
          {!isSidebarCollapsed && (
            <div className="mt-4 flex items-center gap-3">
              <img 
                src="/images/getigne-collectif-logo.png" 
                alt="Gétigné Collectif" 
                className="h-10 w-auto"
              />
              <h2 className="text-xl font-bold text-gray-900">Administration</h2>
            </div>
          )}
          
          {isSidebarCollapsed && (
            <div className="mt-4 flex justify-center">
              <img 
                src="/images/getigne-collectif-logo.png" 
                alt="Gétigné Collectif" 
                className="h-8 w-8 object-contain"
              />
            </div>
          )}
        </div>
        
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="p-3 pb-6">
            {/* Vue d'ensemble */}
            {isSidebarCollapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/admin"
                      className={`
                        flex items-center justify-center px-3 py-2.5 text-sm rounded-lg transition-all mb-2
                        ${isActive('/admin') 
                          ? 'bg-emerald-100 text-emerald-700 font-semibold shadow-sm' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <LayoutDashboard size={18} className={isActive('/admin') ? 'text-emerald-600' : ''} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Vue d'ensemble</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Link
                to="/admin"
                className={`
                  flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all mb-2
                  ${isActive('/admin') 
                    ? 'bg-emerald-100 text-emerald-700 font-semibold shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <LayoutDashboard size={18} className={isActive('/admin') ? 'text-emerald-600' : ''} />
                <span>Vue d'ensemble</span>
              </Link>
            )}

            <Separator className="my-3" />

            {/* Sections du menu */}
            {menuSections.map((section, index) => {
              const sectionKey = section.title.toLowerCase().replace(/\s+/g, '-');
              const isSectionOpen = openSections[sectionKey] ?? true;
              const SectionIcon = section.icon;
              const colorClasses = getColorClasses(section.color);

              return (
                <Collapsible
                  key={sectionKey}
                  open={isSectionOpen && !isSidebarCollapsed}
                  onOpenChange={(open) => !isSidebarCollapsed && toggleSection(sectionKey)}
                >
                  {!isSidebarCollapsed && (
                    <CollapsibleTrigger className="w-full">
                      <div className={`
                        flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-colors mb-1
                        hover:bg-gray-50
                      `}>
                        <div className="flex items-center gap-2.5">
                          <SectionIcon size={18} className={colorClasses.text} />
                          <span className="text-sm font-semibold text-gray-800">{section.title}</span>
                        </div>
                        {isSectionOpen ? (
                          <ChevronDown size={16} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-500" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                  )}

                  {isSidebarCollapsed && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex justify-center mb-2">
                            <div className={`
                              flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer
                              ${colorClasses.bg} hover:opacity-80 transition-opacity
                            `}>
                              <SectionIcon size={18} className={colorClasses.text} />
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{section.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {!isSidebarCollapsed && (
                    <CollapsibleContent>
                      <nav className="space-y-1 ml-2 mt-1">
                        {section.items.map((item) => {
                          const ItemIcon = item.icon;
                          const itemIsActive = isActive(item.href);
                          
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              className={`
                                flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all
                                ${itemIsActive 
                                  ? `${colorClasses.bg} ${colorClasses.text} font-medium` 
                                  : 'text-gray-700 hover:bg-gray-100'
                                }
                              `}
                            >
                              <ItemIcon 
                                size={18} 
                                className={itemIsActive ? colorClasses.text : 'text-gray-500'} 
                              />
                              <span>{item.title}</span>
                            </Link>
                          );
                        })}
                      </nav>
                    </CollapsibleContent>
                  )}

                  {index < menuSections.length - 1 && !isSidebarCollapsed && (
                    <Separator className="my-3" />
                  )}
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          {noContainer ? (
            <div className="px-6">
              {(backLink || title || description || breadcrumb) && (
                <header className="py-6">
                  {backLink && <div className="mb-4">{backLink}</div>}
                  {breadcrumb && <nav aria-label="Breadcrumb" className="mb-2">{breadcrumb}</nav>}
                  {title && <h1 className="text-2xl font-bold">{title}</h1>}
                  {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                </header>
              )}
              {children}
            </div>
          ) : (
            <div className="container mx-auto px-6">
              {(backLink || title || description || breadcrumb) && (
                <header className="py-6">
                  {backLink && <div className="mb-4">{backLink}</div>}
                  {breadcrumb && <nav aria-label="Breadcrumb" className="mb-2">{breadcrumb}</nav>}
                  {title && <h1 className="text-2xl font-bold">{title}</h1>}
                  {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                </header>
              )}
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

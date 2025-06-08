
import React, { useState } from 'react';
import { Star, Car, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/auth';

const FloatingMenu = () => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Ne pas afficher le menu si l'utilisateur n'est pas connecté
  if (!user) return null;

  const menuItems = [
    {
      label: 'Lift',
      href: '/lift',
      icon: Car,
      isExternal: false,
      description: 'Covoiturage solidaire'
    },
    {
      label: 'Communo',
      href: 'https://communo.app/communities/getigne-collectif',
      icon: Users,
      isExternal: true,
      description: 'Communauté en ligne'
    }
  ];

  return (
    <div 
      className="fixed bottom-6 left-6 z-50"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Menu items - apparaissent au survol */}
      <div className={`
        absolute bottom-16 left-0 space-y-3 transition-all duration-300 ease-out
        ${isExpanded 
          ? 'opacity-100 translate-y-0 pointer-events-auto' 
          : 'opacity-0 translate-y-4 pointer-events-none'
        }
      `}>
        {menuItems.map((item, index) => (
          <div
            key={item.label}
            className={`
              transform transition-all duration-300 ease-out
              ${isExpanded 
                ? 'translate-x-0 opacity-100' 
                : '-translate-x-4 opacity-0'
              }
            `}
            style={{ 
              transitionDelay: isExpanded ? `${index * 50}ms` : '0ms' 
            }}
          >
            {item.isExternal ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white hover:bg-getigne-green-100 p-3 rounded-lg shadow-lg border border-gray-200 transition-colors group min-w-48"
              >
                <div className="p-2 bg-getigne-green-500 text-white rounded-lg group-hover:bg-getigne-green-600 transition-colors">
                  <item.icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
                <ExternalLink size={16} className="text-gray-400" />
              </a>
            ) : (
              <Link
                to={item.href}
                className="flex items-center gap-3 bg-white hover:bg-getigne-green-100 p-3 rounded-lg shadow-lg border border-gray-200 transition-colors group min-w-48"
              >
                <div className="p-2 bg-getigne-green-500 text-white rounded-lg group-hover:bg-getigne-green-600 transition-colors">
                  <item.icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Bouton principal */}
      <div 
        className={`
          w-14 h-14 bg-getigne-green-500 hover:bg-getigne-green-600 
          rounded-full flex items-center justify-center shadow-lg cursor-pointer
          transition-all duration-300 ease-out
          ${isExpanded ? 'scale-110 shadow-xl' : 'scale-100'}
        `}
      >
        <Star 
          size={24} 
          className={`
            text-white transition-transform duration-300
            ${isExpanded ? 'rotate-12' : 'rotate-0'}
          `}
          fill="currentColor"
        />
      </div>
    </div>
  );
};

export default FloatingMenu;

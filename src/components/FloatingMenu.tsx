
import React, { useState, useRef, useEffect } from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { DynamicIcon } from '@/components/ui/dynamic-icon';

interface GalaxyItem {
  id: string;
  name: string;
  baseline: string;
  link: string;
  icon: string;
  color: string | null;
  is_external: boolean;
  position: number;
}

const FloatingMenu = () => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuItems, setMenuItems] = useState<GalaxyItem[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ne pas afficher le menu si l'utilisateur n'est pas connecté
  if (!user) return null;

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('galaxy_items')
        .select('*')
        .eq('status', 'active')
        .order('position');

      if (error) throw error;

      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching galaxy items:', error);
      // Fallback vers les éléments par défaut en cas d'erreur
      setMenuItems([]);
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 300); // Délai de 300ms pour permettre de cliquer
  };

  return (
    <div 
      className="fixed bottom-6 left-6 z-50"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
            key={item.id}
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
            {item.is_external ? (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white hover:bg-getigne-green-100 p-3 rounded-lg shadow-lg border border-gray-200 transition-colors group min-w-48"
              >
                <div 
                  className="p-2 text-white rounded-lg group-hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: item.color || '#22c55e' }}
                >
                  <DynamicIcon name={item.icon} size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.baseline}</div>
                </div>
                <ExternalLink size={16} className="text-gray-400" />
              </a>
            ) : (
              <Link
                to={item.link}
                className="flex items-center gap-3 bg-white hover:bg-getigne-green-100 p-3 rounded-lg shadow-lg border border-gray-200 transition-colors group min-w-48"
              >
                <div 
                  className="p-2 text-white rounded-lg group-hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: item.color || '#22c55e' }}
                >
                  <DynamicIcon name={item.icon} size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.baseline}</div>
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

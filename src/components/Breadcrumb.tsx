
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BreadcrumbNames {
  [key: string]: string;
}

const routes: BreadcrumbNames = {
  '': 'Accueil',
  'programme': 'Programme',
  'actualites': 'Actualités',
  'evenements': 'Événements',
  'equipe': 'Notre équipe',
  'contact': 'Contact',
  'commissions': 'Commissions',
  'plan-du-site': 'Plan du site'
};

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  const [committeeNames, setCommitteeNames] = useState<BreadcrumbNames>({});

  useEffect(() => {
    // Fetch committee names if we have commissions in the path
    const fetchCommitteeNames = async () => {
      if (pathnames.includes('commissions') && pathnames.length > 1) {
        try {
          const { data, error } = await supabase
            .from('citizen_committees')
            .select('id, title');
          
          if (error) throw error;
          
          const names: BreadcrumbNames = {};
          data.forEach(committee => {
            names[committee.id] = committee.title;
          });
          
          setCommitteeNames(names);
        } catch (error) {
          console.error('Erreur lors de la récupération des noms de commissions:', error);
        }
      }
    };

    fetchCommitteeNames();
  }, [pathnames]);

  // Don't show breadcrumb on home page
  if (pathnames.length === 0) {
    return null;
  }

  return (
    <div 
      id="breadcrumb"
      className="w-full glass py-3 border-b border-white/20 shadow-sm"
    >
      <nav className="container mx-auto px-4">
        <div className="flex items-center space-x-2 text-getigne-700">
          <Link to="/" className="flex items-center hover:text-getigne-accent transition-colors">
            <Home size={16} className="mr-1" />
            <span>Accueil</span>
          </Link>
          
          {pathnames.map((path, index) => {
            const routePath = pathnames.slice(0, index + 1).join('/');
            const isLast = index === pathnames.length - 1;
            
            // Use committee name if available, otherwise use from routes or path itself
            let displayName = path;
            if (committeeNames[path]) {
              displayName = committeeNames[path];
            } else if (routes[path]) {
              displayName = routes[path];
            }
            
            return (
              <React.Fragment key={routePath}>
                <ChevronRight size={16} className="text-getigne-400" />
                {isLast ? (
                  <span className="font-medium text-getigne-900">{displayName}</span>
                ) : (
                  <Link 
                    to={`/${routePath}`} 
                    className="hover:text-getigne-accent transition-colors"
                  >
                    {displayName}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Breadcrumb;

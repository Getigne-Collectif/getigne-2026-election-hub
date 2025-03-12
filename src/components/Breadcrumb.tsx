
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routes: Record<string, string> = {
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

  // Don't show breadcrumb on home page
  if (pathnames.length === 0) {
    return null;
  }

  return (
    <nav className="container mx-auto px-4 py-3 text-sm">
      <div className="flex items-center space-x-2 text-getigne-700">
        <Link to="/" className="flex items-center hover:text-getigne-accent transition-colors">
          <Home size={16} className="mr-1" />
          <span>Accueil</span>
        </Link>
        
        {pathnames.map((path, index) => {
          const routePath = pathnames.slice(0, index + 1).join('/');
          const isLast = index === pathnames.length - 1;
          const displayName = routes[path] || path;
          
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
  );
};

export default Breadcrumb;

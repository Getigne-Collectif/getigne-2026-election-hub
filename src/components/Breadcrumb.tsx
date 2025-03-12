
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
  'plan-du-site': 'Plan du site',
  'adherer': 'Adhérer'
};

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  const [committeeNames, setCommitteeNames] = useState<BreadcrumbNames>({});
  const [newsTitle, setNewsTitle] = useState<string>("");
  const [eventTitle, setEventTitle] = useState<string>("");

  useEffect(() => {
    // Don't fetch data on home page
    if (pathnames.length === 0) return;

    const fetchData = async () => {
      // Fetch committee names if we have commissions in the path
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

      // Fetch news title if on a news detail page
      if (pathnames.includes('actualites') && pathnames.length > 1) {
        try {
          const newsId = pathnames[pathnames.length - 1];
          const { data, error } = await supabase
            .from('news')
            .select('title')
            .eq('id', newsId)
            .single();
          
          if (!error && data) {
            setNewsTitle(data.title);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du titre de l\'actualité:', error);
        }
      }

      // Fetch event title if on an event detail page
      if (pathnames.includes('evenements') && pathnames.length > 1) {
        try {
          const eventId = pathnames[pathnames.length - 1];
          const { data, error } = await supabase
            .from('events')
            .select('title')
            .eq('id', eventId)
            .single();
          
          if (!error && data) {
            setEventTitle(data.title);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du titre de l\'événement:', error);
        }
      }
    };

    fetchData();
  }, [pathnames]);

  // Don't show breadcrumb on home page
  if (pathnames.length === 0) {
    return null;
  }

  return (
    <div 
      id="breadcrumb"
      className="w-full bg-white py-3 border-b border-getigne-100 shadow-sm"
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
            
            // Use custom title for detail pages
            let displayName = path;
            
            if (isLast && path === pathnames[pathnames.length - 1]) {
              if (pathnames.includes('actualites') && newsTitle) {
                displayName = newsTitle;
              } else if (pathnames.includes('evenements') && eventTitle) {
                displayName = eventTitle;
              } else if (committeeNames[path]) {
                displayName = committeeNames[path];
              } else if (routes[path]) {
                displayName = routes[path];
              }
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

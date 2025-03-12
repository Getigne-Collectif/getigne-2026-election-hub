
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import { Link } from 'react-router-dom';

const SiteMapPage = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const siteStructure = [
    {
      title: 'Accueil',
      path: '/',
      description: 'Page d\'accueil du site Gétigné Collectif'
    },
    {
      title: 'Programme',
      path: '/programme',
      description: 'Notre programme pour les élections municipales'
    },
    {
      title: 'Actualités',
      path: '/actualites',
      description: 'Les dernières actualités du collectif'
    },
    {
      title: 'Événements',
      path: '/evenements',
      description: 'Nos événements et rencontres à venir'
    },
    {
      title: 'Notre équipe',
      path: '/equipe',
      description: 'Les membres qui composent notre collectif'
    },
    {
      title: 'Commissions',
      path: '/commissions',
      description: 'Les commissions citoyennes et leurs travaux'
    },
    {
      title: 'Contact',
      path: '/contact',
      description: 'Formulaire pour nous contacter'
    },
    {
      title: 'Plan du site',
      path: '/plan-du-site',
      description: 'Structure et organisation du site'
    }
  ];

  return (
    <div className="page-content">
      <Navbar />
      <div className="pt-20">
        <Breadcrumb />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Plan du site</h1>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {siteStructure.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className="p-6 bg-white rounded-lg border border-getigne-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-semibold text-getigne-900 mb-2">{item.title}</h2>
                <p className="text-getigne-700">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SiteMapPage;

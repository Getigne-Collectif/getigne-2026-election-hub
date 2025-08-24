
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from "react-helmet-async";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Routes } from '@/routes';

const SiteMapPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <HelmetProvider>
      <Helmet>
        <title>Plan du site | Gétigné Collectif</title>
        <meta
          name="description"
          content="Retrouvez toutes les pages du site de Gétigné Collectif."
        />
      </Helmet>

      <div className="page-content">
        <Navbar />

        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-8">Plan du site</h1>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
              <div>
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Principales pages</h2>
                <ul className="space-y-3">
                  <li>
                    <Link to={Routes.HOME} className="text-getigne-accent hover:underline">
                      Accueil
                    </Link>
                  </li>
                  <li>
                    <Link to={Routes.PROGRAM} className="text-getigne-accent hover:underline">
                      Élections 2026
                    </Link>
                    <ul className="ml-5 mt-2 space-y-2">
                      <li>
                        <Link to={Routes.PROGRAM} className="text-getigne-700 hover:text-getigne-accent">
                          Programme
                        </Link>
                      </li>
                      <li>
                        <Link to={Routes.COMMITTEES} className="text-getigne-700 hover:text-getigne-accent">
                          Commissions citoyennes
                        </Link>
                      </li>
                    </ul>
                  </li>
                  <li>
                    <Link to={Routes.PROJECTS} className="text-getigne-accent hover:underline">
                      Nos projets
                    </Link>
                  </li>
                  <li>
                    <Link to={Routes.NEWS} className="text-getigne-accent hover:underline">
                      Actualités
                    </Link>
                  </li>
                  <li>
                    <Link to={Routes.AGENDA} className="text-getigne-accent hover:underline">
                      Agenda
                    </Link>
                  </li>
                  <li>
                    <Link to={Routes.CONTACT} className="text-getigne-accent hover:underline">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link to={Routes.JOIN} className="text-getigne-accent hover:underline">
                      Adhérer
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Actualités et Agenda</h2>
                <ul className="space-y-3">
                  <li>
                    <Link to={Routes.NEWS} className="text-getigne-accent hover:underline">
                      Toutes les actualités
                    </Link>
                  </li>
                  <li>
                    <Link to={Routes.AGENDA} className="text-getigne-accent hover:underline">
                      Tous les événements
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Informations légales</h2>
                <ul className="space-y-3">
                  <li>
                    <Link to={Routes.LEGAL} className="text-getigne-accent hover:underline">
                      Mentions légales
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Espace membre</h2>
                <ul className="space-y-3">
                  <li>
                    <Link to={Routes.AUTH} className="text-getigne-accent hover:underline">
                      Connexion / Inscription
                    </Link>
                  </li>
                  <li>
                    <Link to={Routes.PROFILE} className="text-getigne-accent hover:underline">
                      Mon profil
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default SiteMapPage;

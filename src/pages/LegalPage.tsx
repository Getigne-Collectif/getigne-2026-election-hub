
import React from 'react';
import {Helmet, HelmetProvider} from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const LegalPage = () => {
  return (
    <>

      <HelmetProvider>
        <Helmet>
          <title>Mentions légales | Gétigné Collectif</title>
          <meta name="description" content="Mentions légales et politique de confidentialité du collectif citoyen de Gétigné" />
        </Helmet>
      </HelmetProvider>

      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-brand-900">Mentions légales</h1>

          <div className="prose max-w-none">
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-brand-800 mb-4">Informations générales</h2>
              <p>
                <strong>Gétigné Collectif</strong><br />
                Collectif citoyen de Gétigné<br />
                19 rue du bois de la roche<br />
                44190 Gétigné<br />
                Email: contact@getigne-collectif.fr
              </p>

              <p className="mt-4">
                <strong>Directeur de la publication :</strong> Leny Bernard, président de l'association.
              </p>

              <p className="mt-4">
                <strong>Hébergement du site :</strong> Ce site est hébergé sur la plateforme Vercel.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-brand-800 mb-4">Politique de confidentialité</h2>

              <h3 className="text-xl font-medium text-brand-700 mt-6 mb-3">Collecte des données personnelles</h3>
              <p>
                Dans le cadre de son activité, le collectif citoyen de Gétigné peut être amené à collecter certaines données personnelles, notamment :
              </p>
              <ul className="list-disc pl-6 my-4">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Adresse postale</li>
                <li>Numéro de téléphone</li>
              </ul>

              <h3 className="text-xl font-medium text-brand-700 mt-6 mb-3">Utilisation des données</h3>
              <p>
                Les informations recueillies sont enregistrées dans un fichier informatisé par le collectif citoyen de Gétigné pour :
              </p>
              <ul className="list-disc pl-6 my-4">
                <li>Communiquer avec vous concernant nos activités et événements</li>
                <li>Vous informer des actions du collectif</li>
                <li>Organiser les commissions citoyennes</li>
                <li>Gérer les adhésions au collectif</li>
              </ul>
              <p>
                Les données collectées ne servent que dans le cadre de l'activité du collectif citoyen de Gétigné et ne sont en aucun cas cédées, louées ou échangées avec des tiers.
              </p>

              <h3 className="text-xl font-medium text-brand-700 mt-6 mb-3">Conservation des données</h3>
              <p>
                Les données personnelles sont conservées pendant la durée strictement nécessaire à la réalisation des finalités pour lesquelles elles ont été collectées, et en tout état de cause pour une durée maximum de 3 ans à compter de notre dernier contact avec vous.
              </p>

              <h3 className="text-xl font-medium text-brand-700 mt-6 mb-3">Vos droits</h3>
              <p>
                Conformément à la loi « Informatique et Libertés » du 6 janvier 1978 modifiée et au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de portabilité et d'effacement de vos données personnelles ou de limitation de leur traitement.
              </p>
              <p className="mt-2">
                Pour exercer ces droits ou pour toute question sur le traitement de vos données, vous pouvez nous contacter par email à : contact@getigne-collectif.fr
              </p>

              <h3 className="text-xl font-medium text-brand-700 mt-6 mb-3">Cookies</h3>
              <p>
                Ce site n'utilise que des cookies techniques strictement nécessaires à son fonctionnement. Ces cookies ne collectent pas d'informations utilisées à des fins publicitaires et ne permettent pas de suivre votre navigation sur d'autres sites.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-brand-800 mb-4">Propriété intellectuelle</h2>
              <p>
                L'ensemble du contenu de ce site (textes, images, vidéos, etc.) est protégé par le droit d'auteur. Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation préalable écrite du collectif citoyen de Gétigné.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default LegalPage;

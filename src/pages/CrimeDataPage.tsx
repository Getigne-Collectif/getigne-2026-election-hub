import { useEffect, useRef, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Tableau de bord statique (d3) servi depuis public/ : l'iframe isole ses scripts
// globaux et son CSS du reste du site, et ses données se chargent en chemins relatifs.
const EMBED_URL = '/embeds/delinquance-getigne/index.html';

const CrimeDataPage = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(2400);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let observer: ResizeObserver | undefined;

    // Même origine : on ajuste la hauteur de l'iframe à son contenu (graphiques redessinés,
    // paragraphes affichés/masqués, bloc « Méthode » déplié…) pour éviter un double ascenseur.
    const attach = () => {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;
      const update = () => setHeight(Math.ceil(doc.body.scrollHeight));
      observer?.disconnect();
      observer = new ResizeObserver(update);
      observer.observe(doc.body);
      update();
    };

    iframe.addEventListener('load', attach);
    if (iframe.contentDocument?.readyState === 'complete') attach();
    return () => {
      iframe.removeEventListener('load', attach);
      observer?.disconnect();
    };
  }, []);

  return (
    <>
      <HelmetProvider>
        <Helmet>
          <title>Délinquance enregistrée à Gétigné, 2016–2025 | Gétigné Collectif</title>
          <meta
            name="description"
            content="Faits enregistrés à Gétigné, Gorges et Clisson de 2016 à 2025, comparés à la Loire-Atlantique et à la France, et repères sur l’armement des polices municipales."
          />
        </Helmet>
      </HelmetProvider>

      <Navbar />

      <main className="pt-24 pb-16 bg-white">
        <iframe
          ref={iframeRef}
          src={EMBED_URL}
          title="Délinquance enregistrée à Gétigné, 2016–2025"
          className="block w-full border-0"
          style={{ height }}
          scrolling="no"
        />
      </main>

      <Footer />
    </>
  );
};

export default CrimeDataPage;


import { useEffect } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import Navbar from '@/components/Navbar';
import Team from '@/components/Team';
import Footer from '@/components/Footer';

const TeamPage = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <HelmetProvider>
      <Helmet>
        <title>Notre équipe | Gétigné Collectif</title>
        <meta
          name="description"
          content="Découvrez l'équipe du Gétigné Collectif, engagée pour une commune plus écologique, solidaire et démocratique."
        />
      </Helmet>
      
      <div className="page-content">
        <Navbar />
        <div className="pt-20">
          <Team />
        </div>
        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default TeamPage;

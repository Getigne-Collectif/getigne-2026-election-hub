
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Team from '@/components/Team';
import Footer from '@/components/Footer';

const TeamPage = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page-content">
      <Navbar />
      <div className="pt-20">
        <Team />
      </div>
      <Footer />
    </div>
  );
};

export default TeamPage;


import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Program from '@/components/Program';
import News from '@/components/News';
import Events from '@/components/Events';
import Team from '@/components/Team';
import Footer from '@/components/Footer';

const Index = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page-content">
      <Navbar />
      <Hero />
      <Program />
      <News />
      <Events />
      <Team />
      <Footer />
    </div>
  );
};

export default Index;

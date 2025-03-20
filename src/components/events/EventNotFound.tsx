
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const EventNotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Événement non trouvé</h1>
          <p className="mb-6">L'événement que vous recherchez n'existe pas ou a été supprimé.</p>
          <Button onClick={() => navigate('/agenda')}>
            Retour à l'agenda
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EventNotFound;

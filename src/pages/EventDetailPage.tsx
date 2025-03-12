
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import NotFound from './NotFound';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        setEvent(data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'événement:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-24 flex-grow flex items-center justify-center">
          <div className="text-center">Chargement de l'événement...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero section with image */}
        <div className="w-full h-[40vh] relative">
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          <img 
            src={event.image} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="container px-4 text-center text-white">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">{event.title}</h1>
              <div className="flex flex-wrap gap-4 justify-center">
                <div className="flex items-center bg-white/20 px-4 py-2 rounded-full text-white text-sm">
                  <Calendar size={16} className="mr-2" />
                  {formatDate(event.date)}
                </div>
                <div className="flex items-center bg-white/20 px-4 py-2 rounded-full text-white text-sm">
                  <Clock size={16} className="mr-2" />
                  {formatTime(event.date)}
                </div>
                <div className="flex items-center bg-white/20 px-4 py-2 rounded-full text-white text-sm">
                  <MapPin size={16} className="mr-2" />
                  {event.location}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="prose prose-lg mx-auto">
            {/* Render event content */}
            <h2>À propos de cet événement</h2>
            <p className="text-xl text-getigne-700">{event.description}</p>
            
            {/* Additional content if available */}
            {event.content && (
              <div dangerouslySetInnerHTML={{ __html: event.content }}></div>
            )}
            
            {/* Back button */}
            <div className="mt-16">
              <Button
                variant="outline"
                className="border-getigne-200"
                onClick={() => navigate('/evenements')}
              >
                <ArrowLeft size={16} className="mr-2" />
                Retour aux événements
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventDetailPage;

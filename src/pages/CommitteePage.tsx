
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Lightbulb, Bicycle, Utensils, Music, Leaf, Calendar } from 'lucide-react';

// Map pour les icônes
const iconMap = {
  Lightbulb,
  Bicycle,
  Utensils,
  Music,
  Leaf
};

const CommitteePage = () => {
  const { id } = useParams();
  const [committee, setCommittee] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchCommitteeData = async () => {
      try {
        // Récupérer les informations de la commission
        const { data: committeeData, error: committeeError } = await supabase
          .from('citizen_committees')
          .select('*')
          .eq('id', id)
          .single();
        
        if (committeeError) throw committeeError;
        
        // Récupérer les travaux de la commission
        const { data: worksData, error: worksError } = await supabase
          .from('committee_works')
          .select('*')
          .eq('committee_id', id)
          .order('date', { ascending: false });
        
        if (worksError) throw worksError;
        
        setCommittee(committeeData);
        setWorks(worksData);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des données de la commission:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    if (id) {
      fetchCommitteeData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-24 flex-grow">
          <div className="text-center">Chargement des informations de la commission...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !committee) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-24 flex-grow">
          <div className="text-center text-red-500">
            {error || "Cette commission n'existe pas."}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const Icon = iconMap[committee.icon] || Leaf;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 pb-12 bg-getigne-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-getigne-accent/10 rounded-lg flex items-center justify-center">
                <Icon className="text-getigne-accent" size={32} />
              </div>
              <div>
                <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                  Commission citoyenne
                </span>
                <h1 className="text-3xl md:text-4xl font-bold mt-2">{committee.title}</h1>
              </div>
            </div>
            <p className="text-getigne-700 text-lg">
              {committee.description}
            </p>
          </div>
        </div>
      </div>

      {/* Committee works */}
      <main className="flex-grow py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Synthèses des travaux</h2>
            
            {works.length === 0 ? (
              <p className="text-getigne-700">
                Aucune synthèse disponible pour le moment. Les travaux de cette commission sont en cours.
              </p>
            ) : (
              <div className="space-y-10">
                {works.map(work => (
                  <div key={work.id} className="bg-white p-6 rounded-xl shadow-sm border border-getigne-100">
                    <div className="flex items-center text-getigne-500 text-sm mb-3">
                      <Calendar size={14} className="mr-1" />
                      <time>{format(new Date(work.date), 'd MMMM yyyy', { locale: fr })}</time>
                    </div>
                    <h3 className="text-xl font-medium mb-4">{work.title}</h3>
                    <div className="text-getigne-700 space-y-4">
                      {work.content.split('\n').map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Participation */}
          <div className="max-w-3xl mx-auto mt-16 pt-10 border-t border-getigne-100">
            <h2 className="text-2xl font-bold mb-4">Participez à cette commission</h2>
            <p className="text-getigne-700 mb-6">
              Les commissions citoyennes sont ouvertes à tous les habitants de Gétigné qui souhaitent s'impliquer 
              dans la vie de notre commune. Aucune compétence particulière n'est requise, juste l'envie de contribuer 
              à l'amélioration de notre cadre de vie.
            </p>
            <div className="bg-getigne-accent/10 p-6 rounded-xl">
              <p className="text-getigne-900 font-medium">
                Vous souhaitez rejoindre cette commission ou obtenir plus d'informations ?
                Contactez-nous à <a href="mailto:commissions@getigne-collectif.fr" className="text-getigne-accent hover:underline">commissions@getigne-collectif.fr</a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CommitteePage;


import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Bike, Utensils, Music, Leaf, ChevronRight, Users } from 'lucide-react';
import { getMemberCount } from '@/components/CommitteeMembers';

// Map pour les icônes
const iconMap = {
  Lightbulb,
  Bicycle: Bike, // Replace Bicycle with Bike
  Utensils,
  Music,
  Leaf
};

const CommitteesPage = () => {
  const [committees, setCommittees] = useState([]);
  const [memberCounts, setMemberCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchCommittees = async () => {
      try {
        const { data, error } = await supabase
          .from('citizen_committees')
          .select('*')
          .order('title');
        
        if (error) throw error;
        
        setCommittees(data);

        // Récupérer le nombre de membres pour chaque commission
        const counts = {};
        for (const committee of data) {
          counts[committee.id] = await getMemberCount(committee.id);
        }
        setMemberCounts(counts);
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des commissions:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchCommittees();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 pb-12 bg-getigne-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
              Démocratie participative
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Nos commissions citoyennes</h1>
            <p className="text-getigne-700 text-lg mb-8">
              Depuis mai 2024, des commissions citoyennes travaillent en lien avec nos élus sur des thématiques 
              essentielles pour l'avenir de notre commune. Découvrez leurs travaux et rejoignez-les !
            </p>
          </div>
        </div>
      </div>

      {/* Committees list */}
      <main className="flex-grow py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-8">Chargement des commissions citoyennes...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">Une erreur est survenue: {error}</div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {committees.map(committee => {
                const Icon = iconMap[committee.icon] || Leaf;
                const memberCount = memberCounts[committee.id] || 0;
                
                return (
                  <Link 
                    key={committee.id} 
                    to={`/commissions/${committee.id}`}
                    className="bg-white rounded-xl overflow-hidden shadow-sm border border-getigne-100 hover:shadow-md transition-shadow p-6"
                  >
                    <div className="w-16 h-16 bg-getigne-accent/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="text-getigne-accent" size={32} />
                    </div>
                    <h2 className="text-xl font-medium mb-3">{committee.title}</h2>
                    <p className="text-getigne-700 mb-4">{committee.description}</p>
                    
                    <div className="flex items-center text-getigne-500 text-sm mb-3">
                      <Users size={16} className="mr-1" />
                      <span>{memberCount} {memberCount > 1 ? 'membres' : 'membre'}</span>
                    </div>
                    
                    <div className="text-getigne-accent flex items-center text-sm font-medium group">
                      Découvrir les travaux
                      <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Participation */}
          <div className="max-w-3xl mx-auto mt-16 pt-10 border-t border-getigne-100">
            <h2 className="text-2xl font-bold mb-4">Participez aux commissions</h2>
            <p className="text-getigne-700 mb-6">
              Les commissions citoyennes sont ouvertes à tous les habitants de Gétigné qui souhaitent s'impliquer 
              dans la vie de notre commune. Aucune compétence particulière n'est requise, juste l'envie de contribuer 
              à l'amélioration de notre cadre de vie.
            </p>
            <p className="text-getigne-700 mb-6">
              Chaque commission se réunit régulièrement pour travailler sur des projets concrets, élaborer des 
              propositions et suivre leur mise en œuvre. Les travaux des commissions alimentent directement le 
              programme municipal de notre collectif.
            </p>
            <div className="bg-getigne-accent/10 p-6 rounded-xl">
              <p className="text-getigne-900 font-medium">
                Vous souhaitez rejoindre une commission ou obtenir plus d'informations ?
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

export default CommitteesPage;

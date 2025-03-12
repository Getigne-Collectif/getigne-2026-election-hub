
import { useState, useEffect } from 'react';
import { Heart, Users, CalendarRange, MousePointer, Wallet, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
}

const JoinPage = () => {
  const [boardMembers, setBoardMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchBoardMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .order('name');
          
        if (error) throw error;
        setBoardMembers(data as TeamMember[]);
      } catch (error) {
        console.error('Erreur lors de la récupération des membres du bureau:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBoardMembers();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
              Rejoignez-nous
            </span>
            <h1 className="text-4xl font-bold mt-4 mb-6">Adhérer au collectif</h1>
            <p className="text-getigne-700 text-lg">
              Soutenez notre collectif et participez activement à la vie démocratique de Gétigné. 
              Votre adhésion permet de financer nos actions et renforce notre légitimité.
            </p>
          </div>
          
          {/* Benefits section */}
          <div className="bg-getigne-50 rounded-xl p-8 mb-16">
            <h2 className="text-2xl font-medium mb-6 text-center">Pourquoi adhérer ?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg">
                <div className="w-12 h-12 bg-getigne-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="text-getigne-accent" size={24} />
                </div>
                <h3 className="text-lg font-medium mb-2">Soutenir nos actions</h3>
                <p className="text-getigne-700">
                  Votre adhésion nous permet de financer nos initiatives locales 
                  et de mener des projets d'intérêt général.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg">
                <div className="w-12 h-12 bg-getigne-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="text-getigne-accent" size={24} />
                </div>
                <h3 className="text-lg font-medium mb-2">Intégrer une communauté</h3>
                <p className="text-getigne-700">
                  Rejoignez un groupe de citoyens engagés et participez 
                  aux réflexions collectives sur l'avenir de notre commune.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg">
                <div className="w-12 h-12 bg-getigne-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <CalendarRange className="text-getigne-accent" size={24} />
                </div>
                <h3 className="text-lg font-medium mb-2">Événements exclusifs</h3>
                <p className="text-getigne-700">
                  Participez à des événements réservés aux adhérents et 
                  bénéficiez d'informations privilégiées sur nos actions.
                </p>
              </div>
            </div>
          </div>
          
          {/* How to join section */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-medium mb-8 text-center">Comment adhérer ?</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-getigne-200 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-medium">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Rendez-vous sur HelloAsso</h3>
                  <p className="text-getigne-700 mb-2">
                    Notre plateforme de paiement sécurisée HelloAsso vous permet d'adhérer en quelques clics.
                  </p>
                  <div className="flex items-center text-getigne-500 text-sm">
                    <MousePointer size={16} className="mr-2" />
                    <a href="https://www.helloasso.com/associations/getigne-collectif/adhesions/adhesion-2025" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-getigne-accent hover:underline"
                    >
                      www.helloasso.com/associations/getigne-collectif
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-getigne-200 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-medium">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Choisissez votre cotisation</h3>
                  <p className="text-getigne-700 mb-3">
                    Nous proposons plusieurs montants de cotisation pour s'adapter à toutes les situations :
                  </p>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="border border-getigne-200 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Cotisation de base</span>
                        <span className="text-getigne-accent font-bold">10€</span>
                      </div>
                      <p className="text-sm text-getigne-700">Adhésion annuelle standard</p>
                    </div>
                    <div className="border border-getigne-200 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Cotisation soutien</span>
                        <span className="text-getigne-accent font-bold">20€</span>
                      </div>
                      <p className="text-sm text-getigne-700">Pour soutenir davantage nos actions</p>
                    </div>
                    <div className="border border-getigne-200 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Cotisation réduite</span>
                        <span className="text-getigne-accent font-bold">5€</span>
                      </div>
                      <p className="text-sm text-getigne-700">Étudiants, demandeurs d'emploi, etc.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-getigne-200 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-medium">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Confirmez votre adhésion</h3>
                  <p className="text-getigne-700">
                    Après paiement, vous recevrez un email de confirmation avec votre reçu. 
                    Nous vous contacterons ensuite pour vous présenter les activités du collectif.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Team section */}
          {!loading && boardMembers.length > 0 && (
            <div className="max-w-4xl mx-auto mb-16">
              <h2 className="text-2xl font-medium mb-8 text-center">Le bureau de l'association</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boardMembers.map((member) => (
                  <div key={member.id} className="bg-white border border-getigne-100 rounded-lg overflow-hidden">
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium mb-1">{member.name}</h3>
                      <p className="text-getigne-500 text-sm mb-2">{member.role}</p>
                      <p className="text-getigne-700 text-sm line-clamp-3">{member.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* CTA section */}
          <div className="bg-getigne-700 text-white rounded-xl p-8 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-medium mb-4">Rejoignez-nous aujourd'hui</h2>
            <p className="mb-6">
              En adhérant à notre collectif, vous contribuez directement à faire avancer 
              les projets qui façonnent l'avenir de Gétigné.
            </p>
            <Button 
              asChild
              className="bg-white text-getigne-700 hover:bg-getigne-100"
            >
              <a href="https://www.helloasso.com/associations/getigne-collectif/adhesions/adhesion-2025" target="_blank" rel="noreferrer">
                <Wallet size={16} className="mr-2" />
                Adhérer maintenant
              </a>
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default JoinPage;

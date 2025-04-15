
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Committee } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth';
import { useAppSettings } from '@/hooks/useAppSettings';
import CommitteeMembers from '@/components/CommitteeMembers';

const Committees = () => {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userRoles, isAdmin } = useAuth();
  const { settings } = useAppSettings();

  // Vérifie si l'utilisateur a accès aux travaux des commissions
  const canViewWorks = settings.showCommitteeWorks || isAdmin || userRoles.includes('program_team');

  useEffect(() => {
    const fetchCommittees = async () => {
      try {
        const { data, error } = await supabase
          .from('citizen_committees')
          .select('*')
          .order('title');
        
        if (error) throw error;
        
        setCommittees(data || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des commissions :', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommittees();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-lg">Chargement des commissions...</p>
          </div>
        </div>
      </section>
    );
  }

  if (committees.length === 0) {
    return null; // Si pas de commissions, on n'affiche pas la section
  }

  return (
    <section className="py-16 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Nos commissions citoyennes</h2>
          <p className="text-lg text-getigne-700 max-w-2xl mx-auto">
            Découvrez les commissions thématiques où les citoyens s'engagent 
            pour faire avancer des projets concrets pour Gétigné.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {committees.map((committee) => {
            // Détermine quelle classe de couleur utiliser
            let colorClass = "bg-getigne-green-50 text-getigne-green-700 border-getigne-green-200";
            
            if (committee.color) {
              switch (committee.color) {
                case 'blue':
                  colorClass = "bg-blue-50 text-blue-700 border-blue-200";
                  break;
                case 'purple':
                  colorClass = "bg-purple-50 text-purple-700 border-purple-200";
                  break;
                case 'orange':
                  colorClass = "bg-orange-50 text-orange-700 border-orange-200";
                  break;
                default:
                  break;
              }
            }
            
            return (
              <Card key={committee.id} className="overflow-hidden">
                <CardHeader className={`${colorClass}`}>
                  <div className="flex items-center gap-4">
                    <div className={`
                      flex items-center justify-center rounded-full w-12 h-12 
                      ${committee.color === 'blue' ? 'bg-blue-600' : 
                        committee.color === 'purple' ? 'bg-purple-600' : 
                        committee.color === 'orange' ? 'bg-orange-600' : 
                        'bg-getigne-green-600'} 
                      text-white`}
                    >
                      <img 
                        src={`/icons/${committee.icon}.svg`}
                        alt={committee.title}
                        className="h-6 w-6"
                      />
                    </div>
                    <CardTitle className="text-xl">{committee.title}</CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="prose-sm text-getigne-700 line-clamp-3">
                    <div dangerouslySetInnerHTML={{ __html: committee.description.substring(0, 150) + '...' }} />
                  </div>
                  
                  <div className="mt-4">
                    <CommitteeMembers committeeId={committee.id} simplified />
                  </div>
                </CardContent>
                
                <CardFooter className="border-t pt-4 flex justify-between items-center">
                  <div className="text-sm text-getigne-500">
                    {canViewWorks ? 'Voir les détails et travaux' : 'En savoir plus'}
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/commissions/${committee.id}`} className="flex items-center gap-1">
                      <span>Voir</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        
        <div className="text-center mt-12">
          <Button asChild variant="outline" size="lg">
            <Link to="/commissions">
              Voir toutes les commissions
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Committees;

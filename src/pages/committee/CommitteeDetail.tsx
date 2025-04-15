import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  Calendar, 
  User, 
  MessageSquare, 
  ChevronRight, 
  Plus,
  Lock
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import CommitteeMembers from '@/components/CommitteeMembers';
import CommitteeContactForm from '@/components/CommitteeContactForm';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import CommitteeWorkModal from '@/components/CommitteeWorkModal';
import { useToast } from '@/components/ui/use-toast';
import { useAppSettings } from '@/hooks/useAppSettings';

interface CommitteeData {
  id: string;
  title: string;
  description: string;
  icon: string;
  team_photo_url?: string | null;
  cover_photo_url?: string | null;
  color?: string | null;
}

type CommitteeWork = {
  id: string;
  title: string;
  content: string;
  date: string;
  committee_id: string;
  files?: any[] | null;
  images?: any[] | null;
  created_at?: string;
  updated_at?: string;
};

const CommitteeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [committee, setCommittee] = useState<CommitteeData | null>(null);
  const [works, setWorks] = useState<CommitteeWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWork, setSelectedWork] = useState<CommitteeWork | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { toast } = useToast();
  const { user, isAdmin, userRoles } = useAuth();
  const { settings } = useAppSettings();

  const [isCommitteeMember, setIsCommitteeMember] = useState(false);

  const canViewWorks = settings.showCommitteeWorks || 
                       isAdmin || 
                       userRoles.includes('program_team') || 
                       isCommitteeMember;

  const [themeColor, setThemeColor] = useState({
    bg: 'bg-getigne-green-50',
    text: 'text-getigne-green-700',
    border: 'border-getigne-green-200',
    hover: 'hover:bg-getigne-green-100',
    accent: 'bg-getigne-green-600'
  });

  useEffect(() => {
    const fetchCommitteeData = async () => {
      try {
        if (!id) return;
        
        const { data: committeeData, error: committeeError } = await supabase
          .from('citizen_committees')
          .select('*')
          .eq('id', id)
          .single();
        
        if (committeeError) throw committeeError;
        
        setCommittee(committeeData);
        
        if (committeeData.color) {
          switch (committeeData.color) {
            case 'green':
              setThemeColor({
                bg: 'bg-getigne-green-50',
                text: 'text-getigne-green-700',
                border: 'border-getigne-green-200',
                hover: 'hover:bg-getigne-green-100',
                accent: 'bg-getigne-green-600'
              });
              break;
            case 'blue':
              setThemeColor({
                bg: 'bg-blue-50',
                text: 'text-blue-700',
                border: 'border-blue-200',
                hover: 'hover:bg-blue-100',
                accent: 'bg-blue-600'
              });
              break;
            case 'purple':
              setThemeColor({
                bg: 'bg-purple-50',
                text: 'text-purple-700',
                border: 'border-purple-200',
                hover: 'hover:bg-purple-100',
                accent: 'bg-purple-600'
              });
              break;
            case 'orange':
              setThemeColor({
                bg: 'bg-orange-50',
                text: 'text-orange-700',
                border: 'border-orange-200',
                hover: 'hover:bg-orange-100',
                accent: 'bg-orange-600'
              });
              break;
            default:
              break;
          }
        }

        if (user) {
          const { data: memberData, error: memberError } = await supabase
            .rpc('is_committee_member', { 
              user_id: user.id, 
              committee_id: id 
            });

          if (!memberError) {
            setIsCommitteeMember(memberData || false);
          }
        }
        
        const { data: worksData, error: worksError } = await supabase
          .from('committee_works')
          .select('*')
          .eq('committee_id', id)
          .order('date', { ascending: false });
        
        if (worksError) throw worksError;
        
        setWorks(worksData);
        setLoading(false);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des données de la commission:', err);
        setError(err.message || 'Une erreur est survenue lors du chargement des données');
        setLoading(false);
      }
    };

    fetchCommitteeData();
  }, [id, user]);

  const handleWorkCreated = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('committee_works')
        .select('*')
        .eq('committee_id', id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      setWorks(data);
      toast({
        title: "Succès",
        description: "Les travaux de la commission ont été mis à jour",
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour des travaux:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les travaux de la commission",
        variant: "destructive"
      });
    }
  };

  const openViewModal = (work: CommitteeWork) => {
    setSelectedWork(work);
    setIsViewModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedWork(null);
    setIsCreateModalOpen(true);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-getigne-accent mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la commission...</p>
        </div>
      </div>
    );
  }

  if (error || !committee) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-lg px-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-700">{error || "Commission non trouvée"}</p>
          <Button asChild className="mt-6">
            <Link to="/commissions">Retour à la liste des commissions</Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>{committee.title} | Commission Citoyenne | Gétigné Collectif</title>
        <meta
          name="description"
          content={`Découvrez la commission citoyenne "${committee.title}": ses membres, ses travaux et comment participer.`}
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow">
          <section className={`pt-32 pb-12 ${themeColor.bg}`}>
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center text-getigne-500 mb-4">
                  <Link to="/commissions" className="text-sm hover:underline">Commissions</Link>
                  <ChevronRight className="h-4 w-4 mx-1" />
                  <span className="text-sm">{committee.title}</span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className={`flex items-center justify-center rounded-full w-20 h-20 md:w-24 md:h-24 ${themeColor.accent} text-white flex-shrink-0`}>
                    <img 
                      src={`/icons/${committee.icon}.svg`}
                      alt={committee.title}
                      className="h-12 w-12 md:h-14 md:w-14"
                    />
                  </div>
                  
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold">{committee.title}</h1>
                    <div className="mt-3 text-getigne-700 prose max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: committee.description }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  <section>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold">Travaux de la commission</h2>
                      
                      {isAdmin && (
                        <Button onClick={openCreateModal} className="flex items-center space-x-1">
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter
                        </Button>
                      )}
                    </div>

                    {!canViewWorks ? (
                      <div className={`p-8 ${themeColor.bg} ${themeColor.border} border rounded-xl flex flex-col items-center text-center`}>
                        <Lock className="h-12 w-12 mb-4 text-getigne-500" />
                        <h3 className="text-xl font-medium mb-2">Contenu réservé</h3>
                        <p className="text-getigne-700 max-w-md">
                          Les travaux de cette commission sont actuellement visibles uniquement pour 
                          les membres de l'équipe programme et les membres de la commission.
                        </p>
                      </div>
                    ) : works.length > 0 ? (
                      <div className="space-y-4">
                        {works.map(work => (
                          <div 
                            key={work.id}
                            onClick={() => openViewModal(work)}
                            className={`p-6 border ${themeColor.border} rounded-xl ${themeColor.hover} cursor-pointer transition-colors`}
                          >
                            <h3 className="text-xl font-medium mb-2">{work.title}</h3>
                            <div className="flex items-center text-getigne-500 mb-3">
                              <Calendar className="h-4 w-4 mr-1" />
                              <time>{formatDate(work.date)}</time>
                            </div>
                            <div className="prose-sm line-clamp-3">
                              <div dangerouslySetInnerHTML={{ __html: work.content.substring(0, 300) + (work.content.length > 300 ? '...' : '') }} />
                            </div>
                            
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-1 text-getigne-500" />
                                <span className="text-sm text-getigne-500">
                                  {work.files?.length > 0 
                                    ? `${work.files.length} document${work.files.length > 1 ? 's' : ''}` 
                                    : 'Aucun document'}
                                </span>
                              </div>
                              
                              <Button 
                                variant="link" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openViewModal(work);
                                }}
                              >
                                Voir le détail
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 border border-dashed rounded-xl">
                        <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-medium mb-2">Pas encore de publications</h3>
                        <p className="text-getigne-500 max-w-md mx-auto">
                          Les travaux de cette commission seront publiés ici prochainement.
                        </p>
                      </div>
                    )}
                  </section>
                </div>
                
                <div className="space-y-8">
                  <div className="p-6 border border-getigne-200 rounded-xl">
                    <h3 className="text-xl font-semibold mb-4">Membres de la commission</h3>
                    <CommitteeMembers committeeId={id} />
                  </div>
                  
                  <CommitteeContactForm 
                    committeeId={id} 
                    committeeName={committee.title}
                    themeColor={themeColor}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
      
      <CommitteeWorkModal
        committeeId={id}
        work={selectedWork}
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        mode="view"
      />
      
      <CommitteeWorkModal
        committeeId={id}
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleWorkCreated}
        mode="create"
      />
    </HelmetProvider>
  );
};

export default CommitteeDetailPage;

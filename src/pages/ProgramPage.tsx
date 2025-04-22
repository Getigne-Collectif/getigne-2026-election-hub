
import { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home, UsersRound, ClipboardList, Scale, Heart, Clock, Edit } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';
import { supabase, TABLES, ProgramGeneral } from '@/integrations/supabase/client';
import ProgramAlertForm from '@/components/program/ProgramAlertForm';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ProgramPointPreview from '@/components/program/ProgramPointPreview';
import CitizenCommittees from '@/components/CitizenCommittees';

interface ProgramItem {
  id: string;
  title: string;
  description: string;
  content: string;
  icon: string;
  image: string;
  created_at: string;
  updated_at: string;
}

const ProgramPage = () => {
  const { user, userRoles, authChecked } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { settings, loading: loadingSettings } = useAppSettings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const { data: programItems, isLoading: loadingProgramItems } = useQuery({
    queryKey: ['programItemsForTabs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.PROGRAM_ITEMS)
        .select('id, title, description, content, icon, image, created_at, updated_at')
        .order('created_at', { ascending: true });
        
      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les sections du programme."
        });
        throw error;
      }
      
      if (data.length > 0 && !activeTab) {
        setActiveTab(data[0].id);
      }
      
      return data as ProgramItem[];
    },
    enabled: settings.showProgram || isAuthorized,
  });

  const { data: programPoints, isLoading: loadingProgramPoints } = useQuery({
    queryKey: ['programPoints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_points')
        .select('*')
        .order('position', { ascending: true });
        
      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les points du programme."
        });
        throw error;
      }
      
      return data;
    },
    enabled: settings.showProgram || isAuthorized,
  });

  const { data: generalPresentation, isLoading: loadingPresentation } = useQuery<ProgramGeneral>({
    queryKey: ['programGeneral'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.PROGRAM_GENERAL)
        .select('*')
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger la présentation générale du programme."
        });
        throw error;
      }
      
      return data as ProgramGeneral || { id: '', content: '', created_at: '', updated_at: '' };
    },
    enabled: settings.showProgram || isAuthorized,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const handleAnchor = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
          }, 500);
        }
      }
    };
    
    handleAnchor();
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (userRoles.includes('admin') || userRoles.includes('program_manager')) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      if (user) {
        toast({
          variant: "destructive",
          title: "Travail en cours",
          description: "Le programme est en cours d'élaboration par les différentes commissions et l'équipe programme."
        });
      }
    }
    setIsChecking(false);
  }, [user, userRoles, authChecked, toast]);

  const showProgramToAll = settings.showProgram;
  const isProgramAdmin = userRoles.includes('admin') || userRoles.includes('program_manager');

  if (loadingSettings || isChecking || (showProgramToAll && (loadingProgramItems || loadingPresentation || loadingProgramPoints))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Programme | Gétigné Collectif</title>
        <meta
          name="description"
          content="Le programme de Gétigné Collectif pour les élections municipales de 2026."
        />
      </Helmet>

      <div className="page-content">
        <Navbar />

        <div className="pt-24 bg-gradient-to-r from-getigne-green-500 to-[#62FCD3] text-white">
          <div className="container mx-auto px-4">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="text-white/90 hover:text-white">
                    <Home className="h-4 w-4 mr-1" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-white/60" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-white">Notre programme</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="max-w-3xl mx-auto text-center">
              <span className="bg-white/10 text-white font-medium px-4 py-1 rounded-full text-sm inline-block mb-4 backdrop-blur-sm">
                Élections 2026
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mt-4 mb-6 drop-shadow-sm">Notre programme</h1>
              <p className="text-white/90 max-w-2xl mx-auto mb-8 text-lg">
                Découvrez nos propositions concrètes pour Gétigné, issues d'un travail collaboratif 
                <strong> avec</strong> les citoyens et <strong>pour</strong> les citoyens.
              </p>
              {isAuthorized && (
                <Button 
                  asChild
                  variant="outline" 
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
              >
                <a href="#engagements" className="px-6 py-2 text-sm font-medium">
                  Découvrir nos propositions
                </a>
              </Button>
              )}
            </div>
          </div>
          
          <div className="w-full overflow-hidden -mb-1 mt-16">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full">
              <path 
                fill="#ffffff" 
                fillOpacity="1" 
                d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,53.3C1120,53,1280,75,1360,85.3L1440,96L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
              ></path>
            </svg>
          </div>
        </div>

        <div className="py-16">
          
          <div className="container mx-auto px-4">
            {showProgramToAll || isAuthorized ? (
              <div>
                <div className="max-w-4xl mx-auto">
                  {generalPresentation && generalPresentation.content && (
                    <div className=" mb-12 relative overflow-hidden">
                      
                      <div className="prose max-w-none rich-content relative z-10">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {generalPresentation.content}
                        </ReactMarkdown>
                      </div>
                      
                      {isAuthorized && (
                        <div className="mt-6 flex justify-end relative z-10">
                          <Button 
                            variant="outline" 
                            size="sm"
                            asChild
                          >
                            <Link to="/admin/program">
                              Modifier la présentation
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}


                  <div className="mb-16 py-12 px-8 bg-gradient-to-r from-getigne-green-500 to-[#62FCD3] rounded-xl text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                    </div>
                    
                    <div className="relative z-10">
                      <h3 className="text-3xl md:text-4xl font-bold mb-4">Ensemble, construisons l'avenir de Gétigné</h3>
                      <p className="text-lg md:text-xl max-w-2xl mx-auto">
                        Un programme pensé par et pour les citoyens, avec une vision durable et solidaire.
                      </p>
                    </div>
                  </div>

                  <div id="valeurs" className="mb-16">
                    <div className="text-center mb-10">
                      <h2 className="text-3xl font-bold mb-4">Les valeurs qui guident notre projet</h2>
                      <p className="text-getigne-700 max-w-2xl mx-auto">Notre programme est construit autour de valeurs fortes qui orientent nos propositions et notre vision pour Gétigné.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-8 rounded-xl shadow-md border border-getigne-100 text-center hover:shadow-lg transition-all transform hover:-translate-y-1">
                        <div className="w-20 h-20 bg-getigne-50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <UsersRound className="h-10 w-10 text-getigne-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Participatif</h3>
                        <p className="text-getigne-700">Impliquer les citoyens dans les décisions qui façonnent notre commune, pour une démocratie locale vivante.</p>
                      </div>
                      
                      <div className="bg-white p-8 rounded-xl shadow-md border border-getigne-100 text-center hover:shadow-lg transition-all transform hover:-translate-y-1">
                        <div className="w-20 h-20 bg-getigne-50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Scale className="h-10 w-10 text-getigne-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Durable</h3>
                        <p className="text-getigne-700">Construire une commune résiliente face aux défis écologiques et sociaux, pour préserver notre environnement.</p>
                      </div>
                      
                      <div className="bg-white p-8 rounded-xl shadow-md border border-getigne-100 text-center hover:shadow-lg transition-all transform hover:-translate-y-1">
                        <div className="w-20 h-20 bg-getigne-50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Heart className="h-10 w-10 text-getigne-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Solidaire</h3>
                        <p className="text-getigne-700">Veiller à ce que personne ne soit laissé de côté dans notre vision commune, pour une société plus juste et inclusive.</p>
                      </div>
                    </div>
                  </div>

                  <div id="engagements" className="mb-16">
                    <div className="text-center mb-12">
                      <h2 className="text-3xl font-bold mb-4">Nos engagements pour Gétigné</h2>
                      <p className="text-getigne-700 max-w-2xl mx-auto">
                        Des propositions concrètes pour construire ensemble l'avenir de notre commune.
                      </p>
                    </div>

                    {programItems && programItems.length > 0 ? (
                      programItems.map((item, index) => (
                        <div key={item.id} className="mb-16">
                          <div className="flex flex-col md:flex-row gap-8 items-stretch">
                            <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:order-2' : ''}`}>
                              <img
                                src={item.image || "/placeholder.svg"}
                                alt={item.title}
                                className="w-full h-64 md:h-80 object-cover rounded-xl shadow-lg"
                              />
                            </div>
                            <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:order-1' : ''} flex flex-col`}>
                              <div className="flex-grow"></div>
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <h3 className="text-2xl font-bold">{item.title}</h3>
                                  {isProgramAdmin && (
                                    <Link
                                      to={`/admin/program/edit/${item.id}`}
                                      className="ml-2"
                                      title="Modifier cette section"
                                    >
                                      <Edit className="h-5 w-5 text-getigne-600 hover:text-getigne-900 transition-colors" />
                                    </Link>
                                  )}
                                </div>
                                <div className="prose max-w-none rich-content">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {item.description}
                                  </ReactMarkdown>
                                </div>
                                <div className="mt-6">
                                  <Button
                                    variant="outline"
                                    onClick={() => toggleSection(item.id)}
                                    className="w-full"
                                  >
                                    {openSections[item.id] ? "Masquer les propositions" : "Voir les propositions"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                          {openSections[item.id] && (
                            <div className="mt-8">
                              <div className="relative">
                                <div className="absolute -top-[6px] left-8 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[10px] border-l-transparent border-r-transparent border-b-getigne-50 border-t-0 border-t-transparent">
                                  <div className="absolute -top-[3px] -left-[10px] w-0 h-0 border-l-[10px] border-r-[10px] border-b-[10px] border-l-transparent border-r-transparent border-b-getigne-200 border-t-0 border-t-transparent"></div>
                                </div>
                                <div className="bg-getigne-50 rounded-xl p-6 border border-getigne-200">
                                  <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-full bg-getigne-accent/10 flex items-center justify-center">
                                      <ClipboardList className="h-5 w-5 text-getigne-accent" />
                                    </div>
                                    <h4 className="text-xl font-semibold text-getigne-800">Nos propositions concrètes</h4>
                                  </div>
                                  {programPoints && programPoints.length > 0 ? (
                                    <div className="space-y-6">
                                      {programPoints
                                        .filter(point => point.program_item_id === item.id)
                                        .map((point, index) => (
                                          <ProgramPointPreview
                                            key={point.id}
                                            point={point}
                                            programItemId={item.id}
                                            icon={item.icon}
                                          />
                                        ))}
                                    </div>
                                  ) : (
                                    <div className="bg-white rounded-lg p-6 text-center">
                                      <p className="text-getigne-700 italic">
                                        Les propositions détaillées sont en cours d'élaboration.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="bg-white rounded-xl shadow-md border border-getigne-100 p-8 mb-8">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 rounded-full bg-getigne-50 flex items-center justify-center mb-4">
                            <Clock className="h-8 w-8 text-getigne-600" />
                          </div>
                          <h2 className="text-2xl font-bold mb-4">En construction</h2>
                          <p className="mb-4 max-w-2xl">
                            Le programme de Gétigné Collectif pour les élections municipales de 2026 est actuellement
                            en cours d'élaboration par nos commissions thématiques.
                          </p>
                          <p className="mb-4 max-w-2xl">
                            Depuis mai 2024, nos commissions travaillent sur différentes thématiques pour construire
                            un programme ambitieux et réaliste pour l'avenir de notre commune.
                          </p>
                          <p className="max-w-2xl">
                            Cette page sera mise à jour régulièrement pour partager l'avancement de nos travaux.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <CitizenCommittees />


                <div className="max-w-4xl mx-auto">
                  <div className="mt-16 mb-8">
                    <div className="bg-getigne-50 rounded-xl overflow-hidden shadow-md">
                      <div className="grid grid-cols-1 md:grid-cols-2">
                        <div className="p-8 flex flex-col justify-center">
                          <h3 className="text-2xl font-bold mb-4">Participez à l'avenir de Gétigné</h3>
                          <p className="mb-6 text-getigne-700">
                            Vous souhaitez contribuer à l'élaboration de notre programme ou nous rejoindre ?
                            Participez à nos réunions et ateliers ouverts à tous les habitants.
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <Button asChild>
                              <Link to="/contact">
                                Nous contacter
                              </Link>
                            </Button>
                            <Button asChild variant="outline">
                              <Link to="/objectif-2026#commissions">
                                Rejoindre une commission
                              </Link>
                            </Button>
                          </div>
                        </div>
                        <div className="bg-getigne-green-500 hidden md:block">
                          <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=1140')] bg-cover bg-center opacity-80"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto">
                <div className="bg-white rounded-xl shadow-md border border-getigne-100 p-8 mb-8">
                  <div className="flex justify-center mb-6">
                    <div className="bg-getigne-100 rounded-full p-4">
                      <Clock size={48} className="text-getigne-700" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-4 text-center">Tic Tac... Tic Tac...</h2>
                  <p className="text-getigne-700 mb-6 text-center">
                    Notre programme est actuellement en cours d'élaboration par les différentes commissions et l'équipe programme.
                    Il sera rendu public très prochainement !
                  </p>
                  <div className="flex flex-col justify-center gap-4 mb-8">
                    <Button asChild>
                      <Link to="/objectif-2026#commissions">Patientez avec le travail des commissions</Link>
                    </Button>
                    {!user && (
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-xs text-center">Vous êtes membre de l'équipe programme ?</div>
                        <Button asChild variant="outline" size="sm">
                          <Link to="/auth">Identifiez-vous</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <ProgramAlertForm />
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default ProgramPage;


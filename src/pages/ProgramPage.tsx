
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
import { Home, LockKeyhole, UsersRound, ClipboardList, Scale, BookOpen, Heart } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';
import { supabase, asTable } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProgramContentComponent from '@/components/program/ProgramContentComponent';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import '../styles/richTextContent.css';

const ProgramPage = () => {
  const { user, userRoles, authChecked } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { settings, loading: loadingSettings } = useAppSettings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("");

  // Fetch program items for tabs
  const { data: programItems, isLoading: loadingProgramItems } = useQuery({
    queryKey: ['programItemsForTabs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_items')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les sections du programme."
        });
        throw error;
      }
      
      // Set the first tab as active if we have program items and no active tab
      if (data.length > 0 && !activeTab) {
        setActiveTab(data[0].id);
      }
      
      return data;
    },
    enabled: settings.showProgram || isAuthorized,
  });

  // Fetch program general presentation
  const { data: generalPresentation, isLoading: loadingPresentation } = useQuery({
    queryKey: ['programGeneral'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(asTable('program_general'))
        .select('*')
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {  // PGRST116 is "not found"
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger la présentation générale du programme."
        });
        throw error;
      }
      
      return data || { content: '' };
    },
    enabled: settings.showProgram || isAuthorized,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
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
          title: "Accès restreint",
          description: "Vous n'avez pas les droits nécessaires pour accéder à cette page."
        });
      }
    }
    setIsChecking(false);
  }, [user, userRoles, authChecked, toast]);

  // If settings are enabled and program is visible, show program to all
  const showProgramToAll = settings.showProgram;

  if (loadingSettings || isChecking || (showProgramToAll && (loadingProgramItems || loadingPresentation))) {
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

        <div className="pt-24 pb-12 bg-getigne-50">
          <div className="container mx-auto px-4">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">
                    <Home className="h-4 w-4 mr-1" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/objectif-2026">
                    Objectif 2026
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Programme</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="max-w-3xl mx-auto text-center">
              <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                Élections 2026
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Notre programme</h1>
            </div>
          </div>
        </div>

        <div className="py-16">
          <div className="container mx-auto px-4">
            {showProgramToAll || isAuthorized ? (
              // Content visible to authorized users or if showProgram is enabled
              <div className="max-w-4xl mx-auto">
                {/* General presentation section */}
                {generalPresentation && generalPresentation.content && (
                  <div className="bg-white rounded-xl shadow-sm border border-getigne-100 p-8 mb-12">
                    <div className="prose max-w-none rich-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {generalPresentation.content}
                      </ReactMarkdown>
                    </div>
                    
                    {isAuthorized && (
                      <div className="mt-6 flex justify-end">
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

                {/* Program values */}
                <div className="mb-12">
                  <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold mb-4">Les valeurs qui guident notre projet</h2>
                    <p className="text-getigne-700">Notre programme est construit autour de valeurs fortes qui orientent nos propositions.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-getigne-100 text-center hover:shadow-md transition-all">
                      <div className="w-16 h-16 bg-getigne-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UsersRound className="h-8 w-8 text-getigne-600" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Participatif</h3>
                      <p className="text-getigne-700">Impliquer les citoyens dans les décisions qui façonnent notre commune.</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-getigne-100 text-center hover:shadow-md transition-all">
                      <div className="w-16 h-16 bg-getigne-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Scale className="h-8 w-8 text-getigne-600" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Durable</h3>
                      <p className="text-getigne-700">Construire une commune résiliente face aux défis écologiques et sociaux.</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-getigne-100 text-center hover:shadow-md transition-all">
                      <div className="w-16 h-16 bg-getigne-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="h-8 w-8 text-getigne-600" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Solidaire</h3>
                      <p className="text-getigne-700">Veiller à ce que personne ne soit laissé de côté dans notre vision commune.</p>
                    </div>
                  </div>
                </div>

                {/* Program themes */}
                <div className="mb-12">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-4">Nos propositions thématiques</h2>
                    <p className="text-getigne-700">Découvrez nos engagements détaillés pour chaque domaine d'action municipale.</p>
                  </div>
                </div>
                
                {programItems && programItems.length > 0 ? (
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
                    <div className="flex justify-center">
                      <TabsList className="h-auto flex-wrap">
                        {programItems.map(item => (
                          <TabsTrigger 
                            key={item.id} 
                            value={item.id}
                            className="gap-2 py-2 px-4"
                          >
                            {item.icon && (
                              <DynamicIcon name={item.icon} className="h-5 w-5" />
                            )}
                            {item.title}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>

                    {/* Program Content for each tab */}
                    {programItems.map(item => (
                      <ProgramContentComponent 
                        key={item.id}
                        programItemId={item.id}
                        value={item.id}
                      />
                    ))}
                  </Tabs>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-getigne-100 p-8 mb-8">
                    <h2 className="text-2xl font-bold mb-4">En construction</h2>
                    <p className="mb-4">
                      Le programme de Gétigné Collectif pour les élections municipales de 2026 est actuellement
                      en cours d'élaboration par nos commissions thématiques.
                    </p>
                    <p className="mb-4">
                      Depuis mai 2024, nos commissions travaillent sur différentes thématiques pour construire
                      un programme ambitieux et réaliste pour l'avenir de notre commune.
                    </p>
                    <p>
                      Cette page sera mise à jour régulièrement pour partager l'avancement de nos travaux.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Access restricted page for other users
              <div className="max-w-xl mx-auto text-center">
                <div className="bg-white rounded-xl shadow-sm border border-getigne-100 p-8">
                  <div className="flex justify-center mb-6">
                    <div className="bg-getigne-100 rounded-full p-4">
                      <LockKeyhole size={48} className="text-getigne-700" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Accès restreint</h2>
                  <p className="text-getigne-700 mb-6">
                    Cette page est réservée aux membres de l'équipe Programme.
                    Notre programme est actuellement en cours d'élaboration et
                    sera rendu public prochainement.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild>
                      <Link to="/objectif-2026">Découvrir notre projet</Link>
                    </Button>
                    {!user && (
                      <Button asChild variant="outline">
                        <Link to="/auth">Se connecter</Link>
                      </Button>
                    )}
                  </div>
                </div>
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

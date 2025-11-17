
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, MessageSquare, Heart, Users, Target, BookOpen, FileDown, Bell, Clock, FileText, Presentation, Calendar, Sparkles, Pencil } from 'lucide-react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import ProgramCommentsSection from '@/components/program/ProgramCommentsSection';
import ProgramLikeButton from '@/components/program/ProgramLikeButton';
import ProgramPointCard from '@/components/program/ProgramPointCard';
import { useAppSettings } from '@/hooks/useAppSettings';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { downloadFileFromUrl, downloadFromSupabasePath } from '@/lib/utils';
import CtaBanner from '@/components/ui/cta-banner';
import type { Tables } from '@/integrations/supabase/types';
import type { ProgramPoint, ProgramCompetentEntity, ProgramFlagshipProject } from '@/types/program.types';
import ProgramAlertForm from '@/components/program/ProgramAlertForm';
import ProgramTimeline from '@/components/program/ProgramTimeline';
import { Routes } from '@/routes';
import { DiscordLogoIcon } from '@radix-ui/react-icons';
import ProgramPointsEditor from '@/components/admin/program/points/ProgramPointsEditor';
import EditorJSRenderer from '@/components/EditorJSRenderer';
import { Switch } from '@/components/ui/switch';
import FlagshipProjectsShowcase from '@/components/program/FlagshipProjectsShowcase';
import FlagshipProjectEditModal from '@/components/program/FlagshipProjectEditModal';
import { fetchFlagshipProjects } from '@/services/programFlagshipProjects';
import { generateProgramPDF } from '@/utils/generateProgramPDF';
import { toast } from 'sonner';

type ProgramPointRow = Tables<'program_points'> & {
  competent_entity?: ProgramCompetentEntity | null;
};

type ProgramItemWithPoints = Tables<'program_items'> & {
  program_points: ProgramPointRow[];
};

const DISCORD_INVITE_URL = import.meta.env.VITE_DISCORD_INVITE_URL as string;

const steps = [
  {
    id: 'commissions',
    title: 'Travaux des commissions',
    description: '5 commissions thématiques, 20+ personnes, 1+ an de travail',
    period: 'Mai 2024 - Mai 2025',
    status: 'completed' as const,
    details: [
      'Commission Biodiversité',
      'Commission Vie locale',
      'Commission Mobilité',
      'Commission Énergie',
      'Commission Alimentation'
    ]
  },
  {
    id: 'synthese',
    title: 'Synthèse et cohérence',
    description: 'Analyse et harmonisation des propositions',
    period: 'Printemps / Été 2025',
    status: 'current' as const,
    details: [
      'Analyse des propositions des commissions',
      'Harmonisation et cohérence globale',
      'Validation des orientations politiques',
      'Rédaction de la première version du programme',
      'Création du site web et des contenus de communication'
    ]
  },
  {
    id: 'publication-evolution',
    title: 'Campagne',
    description: 'Présentation et enrichissement continu',
    period: 'Septembre 2025 - Mars 2026',
    status: 'current' as const,
    details: [
      'Programme complet publié',
      'Réunions de présentation publiques',
      'Amendements lors des événements de démocratie participative',
      'Enrichissement fréquents',
      'Programme vivant et adaptatif jusqu\'aux élections'
    ]
  }
]

const EDIT_MODE_COOKIE = 'program_edit_mode';

const readEditModeFromCookie = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${EDIT_MODE_COOKIE}=([^;]*)`));
  if (!match) {
    return true;
  }

  return decodeURIComponent(match[1]) === '1';
};

const persistEditModeToCookie = (value: boolean) => {
  if (typeof document === 'undefined') {
    return;
  }

  const maxAge = 60 * 60 * 24 * 30; // 30 jours
  document.cookie = `${EDIT_MODE_COOKIE}=${value ? '1' : '0'}; path=/; max-age=${maxAge}`;
};

const ProgramPage = () => {
  const { user, isAdmin, userRoles } = useAuth();
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(() => readEditModeFromCookie());
  const [editingFlagshipProject, setEditingFlagshipProject] = useState<ProgramFlagshipProject | null>(null);
  const [flagshipEditModalOpen, setFlagshipEditModalOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { settings } = useAppSettings();
  
  // Refs pour le sticky header de la section mesures
  const measuresSectionRef = React.useRef<HTMLDivElement>(null);
  const measuresHeaderRef = React.useRef<HTMLDivElement>(null);
  const [showMeasuresSticky, setShowMeasuresSticky] = useState(false);

  const canAccessProgram = 
    settings.showProgram || 
    userRoles.includes('admin') || 
    userRoles.includes('program_manager');

  useEffect(() => {
    // Ne scroller en haut que s'il n'y a pas d'ancre dans l'URL
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  const scrollToSection = async (slug: string) => {
    const el = document.getElementById(`section-${slug}`);
    if (el) {
      // Attendre un peu que les images de la section cible soient chargées
      const sectionImages = Array.from(el.querySelectorAll('img'));
      const imagePromises = sectionImages
        .filter(img => !img.complete)
        .map(img => 
          new Promise<void>(resolve => {
            img.addEventListener('load', () => resolve());
            img.addEventListener('error', () => resolve());
            setTimeout(() => resolve(), 1000);
          })
        );
      
      if (imagePromises.length > 0) {
        await Promise.all(imagePromises);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Mettre à jour l'URL avec l'ancre
      window.history.pushState(null, '', `#${slug}`);
    }
  };

  const {
    data: programGeneral,
    isLoading: isLoadingGeneral,
    refetch: refetchGeneral,
  } = useQuery({
    queryKey: ['program-general'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_general')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    },
  });

  const {
    data: programItems,
    isLoading: isLoadingItems,
    refetch: refetchProgramItems,
  } = useQuery<ProgramItemWithPoints[]>({
    queryKey: ['program-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_items')
        .select(`
          *,
          program_points (
            id,
            title,
            content,
            position,
            files,
            files_metadata,
            program_item_id,
            status,
            competent_entity_id,
            competent_entity:program_competent_entities (
              id,
              name,
              logo_url,
              logo_path
            )
          )
        `)
        .order('position', { ascending: true })
        .order('title', { ascending: true });

      if (error) throw error;

      return (data || []).map((item) => {
        const rawPoints =
          (item as unknown as { program_points?: Tables<'program_points'>[] | null }).program_points || [];

        const normalizedPoints = rawPoints
          .map((point) => {
            const competentEntity =
              (point as unknown as { competent_entity?: ProgramCompetentEntity | null }).competent_entity ?? null;

            return {
              ...point,
              files: Array.isArray(point.files) ? (point.files as string[]) : [],
              files_metadata: Array.isArray(point.files_metadata)
                ? (point.files_metadata as { url?: string | null; label?: string | null; path?: string | null }[])
                    .filter((meta) => typeof meta?.url === 'string')
                    .map((meta) => ({
                      url: meta.url as string,
                      label: meta.label ?? (meta.url ? meta.url.split('/').pop() ?? 'Fichier' : 'Fichier'),
                      path: meta.path ?? null,
                    }))
                : [],
              status: point.status ?? 'validated',
              competent_entity: competentEntity,
            };
          })
          .sort((a, b) => a.position - b.position);

        return {
          ...item,
          program_points: normalizedPoints,
        };
      });
    },
  });

  const {
    data: flagshipProjects,
    isLoading: isLoadingFlagship,
    refetch: refetchFlagshipProjects,
  } = useQuery<ProgramFlagshipProject[]>({
    queryKey: ['program-flagship-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_flagship_projects')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((project) => ({
        ...project,
        description: project.description ?? null,
      })) as ProgramFlagshipProject[];
    },
  });

  const { data: userLikes } = useQuery({
    queryKey: ['user-program-likes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('program_likes')
        .select('program_item_id, program_point_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const isProgramAdmin = isAdmin || userRoles.includes('program_manager');
  const showAdminControls = isProgramAdmin && isEditMode;
  const validatedPointsCount =
    programItems?.reduce((count, item) => {
      const points = Array.isArray(item.program_points) ? item.program_points : [];
      const validatedPoints = points.filter((point) => {
        const status = (point.status as 'draft' | 'pending' | 'validated' | null) ?? 'validated';
        return status === 'validated';
      });
      return count + validatedPoints.length;
    }, 0) ?? 0;
  const shouldDisplayCounter = validatedPointsCount >= 10;
  const hasFlagshipProjects = (flagshipProjects?.length ?? 0) > 0;

  // Observe sections to highlight the active one in the sidebar
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('[data-section-id]')) as HTMLElement[];
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = (visible[0].target as HTMLElement).dataset.sectionId || null;
          if (id) setActiveSectionId(id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((s) => observer.observe(s));

    return () => observer.disconnect();
  }, [programItems]);

  // Scroll vers la section indiquée par l'ancre dans l'URL au chargement
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && programItems) {
      // Attendre que tout le contenu soit chargé (y compris le mode édition)
      const waitForContentToLoad = async () => {
        // Attendre un peu que le DOM soit rendu
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Utiliser un MutationObserver pour détecter quand le DOM arrête de changer
        let mutationTimeout: NodeJS.Timeout;
        const stabilityDelay = 500; // Temps d'attente sans changement pour considérer la page stable
        
        const waitForDomStability = new Promise<void>((resolve) => {
          const observer = new MutationObserver(() => {
            clearTimeout(mutationTimeout);
            mutationTimeout = setTimeout(() => {
              observer.disconnect();
              resolve();
            }, stabilityDelay);
          });
          
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
          });
          
          // Démarrer le timer initial
          mutationTimeout = setTimeout(() => {
            observer.disconnect();
            resolve();
          }, stabilityDelay);
          
          // Timeout de sécurité maximum de 5 secondes
          setTimeout(() => {
            observer.disconnect();
            resolve();
          }, 5000);
        });
        
        await waitForDomStability;
        
        // Récupérer toutes les images de la page
        const images = Array.from(document.images);
        const imagePromises = images
          .filter(img => !img.complete)
          .map(img => 
            new Promise<void>(resolve => {
              img.addEventListener('load', () => resolve());
              img.addEventListener('error', () => resolve());
              setTimeout(() => resolve(), 2000);
            })
          );
        
        await Promise.all(imagePromises);
        
        // Attendre encore un peu pour être sûr que tout est stabilisé
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Maintenant on peut scroller
        const el = document.getElementById(`section-${hash}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
      
      waitForContentToLoad();
    }
  }, [programItems]);

  useEffect(() => {
    if (isProgramAdmin) {
      setIsEditMode(readEditModeFromCookie());
    }
  }, [isProgramAdmin]);

  // Gestion du sticky header de la section mesures
  useEffect(() => {
    const handleScroll = () => {
      if (!measuresSectionRef.current || !measuresHeaderRef.current) return;
      
      const sectionRect = measuresSectionRef.current.getBoundingClientRect();
      const headerRect = measuresHeaderRef.current.getBoundingClientRect();
      
      const isInSection = sectionRect.top < 80 && sectionRect.bottom > 80;
      const headerHidden = headerRect.bottom < 80;
      
      setShowMeasuresSticky(isInSection && headerHidden);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [programItems]);

  const handleEditModeToggle = (checked: boolean) => {
    setIsEditMode(checked);
    persistEditModeToCookie(checked);
    refetchProgramItems();
    refetchGeneral();
    refetchFlagshipProjects();
  };

  const handleGeneratePDF = async () => {
    if (!programGeneral || !programItems || !flagshipProjects) {
      toast.error('Les données du programme ne sont pas encore chargées');
      return;
    }

    setIsGeneratingPDF(true);
    const toastId = toast.loading('Génération du PDF en cours...');

    try {
      await generateProgramPDF(
        programGeneral,
        flagshipProjects,
        programItems,
        (message) => {
          toast.loading(message, { id: toastId });
        }
      );
      toast.success('PDF généré avec succès !', { id: toastId });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error(
        `Erreur lors de la génération du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        { id: toastId }
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!canAccessProgram) {
    return (
      <HelmetProvider>
        <Helmet>
          <title>Programme - Objectif 2026 | Gétigné Collectif</title>
          <meta name="description" content="Découvrez le programme politique de Gétigné Collectif pour 2026" />
        </Helmet>
        
        <div className="min-h-screen bg-gradient-to-br from-getigne-50 to-getigne-100">
          <Navbar />
          
          <div className="pt-20 pb-16">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                {/* En-tête principal avec illustration */}
                <div className="text-center mb-12">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-getigne-accent/10 rounded-full mb-6">
                    <Clock className="w-12 h-12 text-getigne-accent" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-getigne-900 mb-4">
                    Tic... Tac...
                  </h1>
                  <p className="text-xl text-getigne-700 max-w-4xl mx-auto leading-relaxed mb-6">
                    L'équipe programme finalise actuellement la synthèse des travaux de nos 5 commissions thématiques, 
                    composées d'une vingtaine de personnes qui travaillent depuis plus d'un an sur des propositions concrètes 
                    pour l'avenir de Gétigné.
                  </p>
                  
                  {/* Aperçu du timing */}
                  <div className="inline-flex items-center gap-4 bg-getigne-accent/10 text-getigne-700 px-6 py-3 rounded-full text-sm font-medium">
                    <span>📅 Mai 2024 - Mai 2025 : Travaux des commissions</span>
                    <span>•</span>
                    <span>📝 Printemps/Été 2025 : Synthèse</span>
                    <span>•</span>
                    <span>🚀 Sept. 2025 - Mars 2026 : Publication & amélioration</span>
                  </div>
                </div>

                {/* Frise chronologique du processus */}
                <div className="bg-white rounded-xl shadow-lg border border-getigne-100 p-6 mb-8">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-getigne-900 mb-2">Notre processus de travail</h2>
                    <p className="text-getigne-700 text-sm">
                      Découvrez comment nous élaborons ensemble ce programme, étape par étape.
                    </p>
                  </div>
                  
                  <ProgramTimeline 
                    compact={true}
                    showToggle={true}
                    steps={steps}
                  />
                </div>

                {/* Grille de contenu */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                  {/* Formulaire d'alerte sur 2 colonnes */}
                  <div className="lg:col-span-2">

                      <ProgramAlertForm />
                  </div>

                  {/* Carte : Rejoignez-nous sur 1 colonne */}
                  <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-getigne-accent to-cyan-500 text-white rounded-xl shadow-lg p-6 text-center h-full flex flex-col gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold">Rencontrons-nous !</h3>
                      <p className="text-white/90 mb-4">
                        Participez à nos événements et rencontres pour découvrir notre projet et échanger avec nous en direct ou virtuellement en rejoignant notre Discord.
                      </p>
                      <Button 
                        asChild 
                        className="bg-white text-getigne-900 hover:bg-white/90"
                      >
                        <a href={Routes.AGENDA}>Voir nos événements</a>
                      </Button>
                      {DISCORD_INVITE_URL && (
                      <Button 
                        asChild 
                        className="bg-indigo-400 text-white hover:bg-indigo-400/90 border-2 border-solid border-indigo-500"
                      >
                        <a href={DISCORD_INVITE_URL}><DiscordLogoIcon className="w-4 h-4 mr-2 text-white"/>Rejoignez le Discord</a>
                      </Button>
                      )}
                      <p className="text-white/90">
                        Ou échangeons tout simplement par téléphone : <a href="tel:+33666777520" className="text-white/90 hover:text-white/70 font-bold">06 66 77 75 20</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Footer />
        </div>
      </HelmetProvider>
    );
  }

  if (isLoadingGeneral || isLoadingItems || isLoadingFlagship) {
    return (
      <HelmetProvider>
        <div className="min-h-screen bg-gradient-to-br from-getigne-50 to-getigne-100">
          <Navbar />
          <div className="pt-20 pb-16">
            <div className="container mx-auto px-4">
              <div className="text-center">
                <p>Chargement du programme...</p>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Programme - Objectif 2026 | Gétigné Collectif</title>
        <meta name="description" content="Découvrez le programme politique de Gétigné Collectif pour 2026" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-getigne-50 to-getigne-100">
        <Navbar />
        
        <div className="pt-20 pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {isProgramAdmin && (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end mb-8">
                  <div className="flex items-center gap-3 bg-white border border-getigne-200 rounded-full px-4 py-2 shadow-sm">
                    <span className="text-sm font-medium text-getigne-700">Mode édition</span>
                    <Switch
                      id="program-edit-mode-toggle"
                      checked={isEditMode}
                      onCheckedChange={handleEditModeToggle}
                      aria-label="Activer le mode édition du programme"
                    />
                  </div>
                  <Button
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF || !programGeneral || !programItems || !flagshipProjects}
                    className="bg-getigne-accent text-white hover:bg-getigne-accent/90"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    {isGeneratingPDF ? 'Génération...' : 'Télécharger le PDF complet'}
                  </Button>
                  {showAdminControls && (
                    <Button asChild>
                      <a href="/admin/program">Administrer le programme</a>
                    </Button>
                  )}
                </div>
              )}

              {programGeneral && (
                <div className="mb-12 overflow-hidden rounded-2xl border border-getigne-accent/20 shadow-xl">
                  <div className="relative bg-gradient-to-r from-getigne-accent to-cyan-500 text-white">
                    <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-white/10 blur-3xl md:block" aria-hidden />
                    <div className="relative px-6 py-10 md:px-12 md:py-14">
                      <div className="max-w-4xl">
                        <p className="uppercase tracking-widest text-white/80 text-xs md:text-sm mb-3">Un projet collectif et vivant</p>
                        <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
                          Un programme ambitieux, réfléchi et participatif
                        </h2>
                        <p className="text-white/90 text-lg md:text-xl max-w-3xl">
                          Co-construit avec les habitantes et habitants, enrichi en continu, orienté vers l'action concrète.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                          <span className="bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-sm">Participatif</span>
                          <span className="bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-sm">Transversal</span>
                          <span className="bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-sm">Écologique & sociale</span>
                          <span className="bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-sm">Évolutif</span>
                        </div>
                        {programGeneral?.file && (
                          <div className="mt-8">
                            <Button
                              size="lg"
                              className="bg-white text-getigne-900 hover:bg-white/90"
                              onClick={async () => {
                                try {
                                  const pg = programGeneral as { file?: string | null; file_path?: string | null };
                                  if (pg.file_path) {
                                    await downloadFromSupabasePath('program_files', pg.file_path, 'programme.pdf');
                                  } else {
                                    await downloadFileFromUrl(pg.file!, 'programme.pdf');
                                  }
                                } catch {
                                  // Pas d’ouverture d’onglet ici pour éviter d’ouvrir le PDF: on reste silencieux
                                }
                              }}
                            >
                              <FileDown className="w-4 h-4 mr-2" /> Télécharger le PDF
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white px-6 py-8 md:px-12 md:py-10">
                    <div className="max-w-4xl">

                      <div className="rich-content prose max-w-none text-getigne-800">
                        <EditorJSRenderer data={programGeneral.content || ''} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section projets phares - Pleine largeur sans container */}
        {hasFlagshipProjects && flagshipProjects && (
          <>
            <FlagshipProjectsShowcase 
              projects={flagshipProjects}
              isProgramAdmin={isProgramAdmin}
              onEditProject={(project) => {
                setEditingFlagshipProject(project);
                setFlagshipEditModalOpen(true);
              }}
            />
            <FlagshipProjectEditModal
              project={editingFlagshipProject}
              open={flagshipEditModalOpen}
              onOpenChange={setFlagshipEditModalOpen}
              onSuccess={() => {
                refetchFlagshipProjects();
              }}
            />
          </>
        )}

        {/* Section Nos mesures - Pleine largeur sans container */}
        <div ref={measuresSectionRef} className="w-full">
          {/* Sticky header léger */}
          <div 
            className={`hidden md:block sticky top-16 z-30 transition-all duration-300 ${
              showMeasuresSticky ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            }`}
          >
            <div className="bg-gradient-to-r from-getigne-accent to-cyan-500 border-b border-white/20 shadow-md">
              <div className="container mx-auto px-4 py-3">
                <div className="max-w-6xl mx-auto flex items-center gap-2 text-white">
                  <Target className="w-4 h-4" />
                  <span className="font-bold text-sm md:text-base">
                    {shouldDisplayCounter ? `Nos ${validatedPointsCount} mesures pour Gétigné` : 'Nos mesures pour Gétigné'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div ref={measuresHeaderRef} className="bg-gradient-to-r from-getigne-accent to-cyan-500 py-12 md:py-16 lg:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full text-white text-xs md:text-sm font-medium mb-4 md:mb-6">
                  <Target className="w-3 h-3 md:w-4 md:h-4" />
                  <span>Notre programme détaillé</span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 md:mb-4 px-4">
                  {shouldDisplayCounter ? `Nos ${validatedPointsCount} mesures pour Gétigné` : 'Nos mesures pour Gétigné'}
                </h2>
                <p className="text-base md:text-lg lg:text-xl text-white/90 max-w-3xl mx-auto px-4">
                  Découvrez les mesures concrètes que nous proposons pour Gétigné, classées par thématique. Réagissez en commentant et participez à l'élaboration de notre projet !
                </p>
              </div>
            </div>
          </div>

          {/* Contenu des mesures */}
          <div className="py-16 md:py-20 lg:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Navigation Mobile (horizontale) */}
              {programItems && programItems.length > 0 && (
                <div className="md:hidden sticky top-16 z-20 -mx-4 px-4 bg-white/80 backdrop-blur-lg py-4 mb-8 border-b border-gray-200 shadow-sm">
                  <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    {programItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.slug)}
                        className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                          activeSectionId === item.slug
                            ? 'bg-gradient-to-r from-getigne-accent to-cyan-500 text-white border-transparent shadow-lg'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-getigne-accent/30'
                        }`}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Grille avec barre latérale gauche (desktop) et contenu principal */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <aside className="hidden lg:block lg:col-span-3">
                  <div 
                    className="sticky space-y-4 transition-all duration-300"
                    style={{ top: showMeasuresSticky ? '130px' : '96px' }}
                  >
                    <nav className="space-y-3">
                      {programItems?.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => scrollToSection(item.slug)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                            activeSectionId === item.slug
                              ? 'bg-gradient-to-r from-getigne-accent to-cyan-500 text-white border-transparent shadow-lg'
                              : 'bg-white text-getigne-800 border-gray-200 hover:border-getigne-accent/30 hover:shadow-md'
                          }`}
                        >
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${
                            activeSectionId === item.slug ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-50'
                          }`}>
                            <DynamicIcon name={item.icon} className={`w-5 h-5 ${activeSectionId === item.slug ? 'text-white' : 'text-getigne-700'}`} />
                          </span>
                          <span className="text-left text-sm font-medium line-clamp-2">{item.title}</span>
                        </button>
                      ))}
                    </nav>

                    {/* CTA dans la sidebar */}
                    {programGeneral?.file && (
                      <div className="pt-2">
                        <CtaBanner
                          title="Téléchargez le programme en PDF"
                          content="Conservez-le, partagez-le, diffusez-le autour de vous."
                          iconName="FileDown"
                          buttonLabel="Télécharger le PDF"
                          buttonHref={programGeneral.file}
                          compact
                          download
                          downloadName="programme.pdf"
                        />
                      </div>
                    )}
                  </div>
                </aside>
                <main className="lg:col-span-9 space-y-12 md:space-y-16">
                  {programItems?.map((item) => {
                    const allPoints = Array.isArray(item.program_points) ? item.program_points : [];
                    const visitorPoints = allPoints.filter((point) => {
                      const status = (point.status as 'draft' | 'pending' | 'validated' | null) ?? null;
                      return status === null || status === 'validated' || status === 'pending';
                    });
                    const pointsToDisplay = showAdminControls ? allPoints : visitorPoints;
                    const hasDescriptionContent = (() => {
                      if (!item.description) return false;
                      if (typeof item.description === 'string') {
                        try {
                          const parsed = JSON.parse(item.description);
                          return Array.isArray(parsed?.blocks) && parsed.blocks.length > 0;
                        } catch {
                          return item.description.trim().length > 0;
                        }
                      }
                      return Array.isArray((item.description as unknown as { blocks?: unknown[] })?.blocks) &&
                        ((item.description as unknown as { blocks?: unknown[] }).blocks?.length ?? 0) > 0;
                    })();

                    return (
                    <section
                      key={item.id}
                      id={`section-${item.slug}`}
                      data-section-id={item.slug}
                      className="scroll-mt-24"
                    >
                      <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                        {/* Image en haut de la card si elle existe */}
                        {item.image && (
                          <div className="relative overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-56 md:h-80 lg:h-96 object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                            />
                            {/* Gradient overlay en bas de l'image */}
                            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
                          </div>
                        )}
                        
                        <div className="p-6 md:p-8 lg:p-10">
                          {/* En-tête avec titre et icône */}
                          <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-getigne-accent to-cyan-500 text-white shadow-lg flex-shrink-0">
                              <DynamicIcon name={item.icon} className="w-6 h-6 md:w-7 md:h-7" />
                            </div>
                            <div className="flex-1">
                              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-getigne-900 leading-tight">
                                {item.title}
                              </h2>
                            </div>
                            <div className="hidden md:block flex-shrink-0">
                              <ProgramLikeButton programId={item.id} />
                            </div>
                          </div>

                          {hasDescriptionContent && (
                            <div className="mb-8">
                              <EditorJSRenderer
                                data={item.description ?? ''}
                                className="prose prose-base md:prose-lg max-w-none rich-content text-gray-700"
                              />
                            </div>
                          )}

                          {item.content && (
                            <div className="prose prose-base md:prose-lg max-w-none rich-content mb-8">
                              <div dangerouslySetInnerHTML={{ __html: item.content }} />
                            </div>
                          )}
                          {showAdminControls ? (
                            <div className="mt-10 pt-8 border-t border-gray-200">
                              <h3 className="text-xl font-bold text-getigne-900 mb-4 flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-getigne-accent/10 text-getigne-accent">
                                  <Pencil className="w-4 h-4" />
                                </span>
                                Gestion des points de la section
                              </h3>
                              <div className="mt-4">
                                <ProgramPointsEditor
                                  programItemId={item.id}
                                  onPointsUpdated={() => {
                                    refetchProgramItems();
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            pointsToDisplay && pointsToDisplay.length > 0 && (
                              <div className="mt-10 space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-getigne-accent to-cyan-500 text-white">
                                    <Target className="w-5 h-5" />
                                  </div>
                                  <h3 className="text-xl md:text-2xl font-bold text-getigne-900">
                                    Points du programme
                                  </h3>
                                </div>
                                {pointsToDisplay.map((point: Tables<'program_points'>) => {
                                  const normalizedPoint: ProgramPoint = {
                                    id: point.id,
                                    title: point.title as unknown as string,
                                    content: point.content as unknown as string,
                                    position: point.position,
                                    program_item_id: point.program_item_id,
                                    status: (point.status as 'draft' | 'pending' | 'validated') || 'validated',
                                  competent_entity_id:
                                    (point as unknown as { competent_entity_id?: string | null }).competent_entity_id ?? null,
                                  competent_entity:
                                    (point as unknown as { competent_entity?: ProgramCompetentEntity | null }).competent_entity ?? null,
                                    files: Array.isArray(point.files) ? (point.files as string[]) : [],
                                    files_metadata: Array.isArray(point.files_metadata)
                                      ? (point.files_metadata as { url?: string | null; label?: string | null; path?: string | null }[])
                                          .filter((meta) => typeof meta?.url === 'string')
                                          .map((meta) => ({
                                            url: meta.url as string,
                                            label:
                                              meta.label ??
                                              (meta.url ? meta.url.split('/').pop() ?? 'Fichier' : 'Fichier'),
                                            path: meta.path ?? null,
                                          }))
                                      : [],
                                    created_at: point.created_at,
                                    updated_at: point.updated_at,
                                  };

                                  return (
                                    <ProgramPointCard
                                      key={point.id}
                                      point={normalizedPoint}
                                      programItemId={item.id}
                                      icon={item.icon}
                                    />
                                  );
                                })}
                              </div>
                            )
                          )}

                          <div className="mt-10 pt-8 border-t border-gray-200">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-getigne-accent to-cyan-500 text-white">
                                <MessageSquare className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-xl md:text-2xl font-bold text-getigne-900">
                                  Vos réactions
                                </h3>
                                <p className="text-sm text-gray-600 mt-0.5">
                                  Participez à l'élaboration de ce thème
                                </p>
                              </div>
                            </div>
                            <ProgramCommentsSection
                              programItemId={item.id}
                              programPointId={null}
                            />
                          </div>
                        </div>
                      </div>
                    </section>
                    );
                  })}

                </main>
              </div>

              {/* Frise chronologique du processus (version publique) */}
              <div className="mt-16 md:mt-20">
                <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                  <div className="bg-gradient-to-r from-getigne-accent to-cyan-500 p-6 md:p-8">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-extrabold text-white">
                        Les étapes de l'élaboration de ce programme
                      </h3>
                    </div>
                  </div>
                  <div className="p-6 md:p-8 lg:p-10">
                    <ProgramTimeline 
                      mini={false}
                      showToggle={false}
                      steps={steps}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default ProgramPage;


import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, MessageSquare, Heart, Users, Target, BookOpen, FileDown, Bell, Clock, FileText, Presentation, Calendar } from 'lucide-react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProgramCommentsSection from '@/components/program/ProgramCommentsSection';
import ProgramLikeButton from '@/components/program/ProgramLikeButton';
import ProgramPointCard from '@/components/program/ProgramPointCard';
import { useAppSettings } from '@/hooks/useAppSettings';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { downloadFileFromUrl, downloadFromSupabasePath } from '@/lib/utils';
import CtaBanner from '@/components/ui/cta-banner';
import type { Tables } from '@/integrations/supabase/types';
import type { ProgramPoint, ProgramCompetentEntity } from '@/types/program.types';
import ProgramAlertForm from '@/components/program/ProgramAlertForm';
import ProgramTimeline from '@/components/program/ProgramTimeline';
import { Routes } from '@/routes';
import { DiscordLogoIcon } from '@radix-ui/react-icons';
import ProgramPointsEditor from '@/components/admin/program/points/ProgramPointsEditor';
import EditorJSRenderer from '@/components/EditorJSRenderer';
import { Switch } from '@/components/ui/switch';

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
  const { settings } = useAppSettings();

  const canAccessProgram = 
    settings.showProgram || 
    userRoles.includes('admin') || 
    userRoles.includes('program_manager');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  useEffect(() => {
    if (isProgramAdmin) {
      setIsEditMode(readEditModeFromCookie());
    }
  }, [isProgramAdmin]);

  const handleEditModeToggle = (checked: boolean) => {
    setIsEditMode(checked);
    persistEditModeToCookie(checked);
    refetchProgramItems();
    refetchGeneral();
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

  if (isLoadingGeneral || isLoadingItems) {
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
                  {showAdminControls && (
                    <Button asChild>
                      <a href="/admin/program">Administrer le programme</a>
                    </Button>
                  )}
                </div>
              )}
              <div className="text-center mb-12">
                <div className="inline-flex items-center space-x-2 bg-getigne-accent/10 text-getigne-accent px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Target className="w-4 h-4" />
                  <span>Programme participatif</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-getigne-900 mb-4">
                  Objectif 2026
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Notre programme pour Gétigné, élaboré avec vous et pour vous
                </p>
              </div>

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

              {/* Navigation Mobile (horizontale) */}
              {programItems && programItems.length > 0 && (
                <div className="md:hidden sticky top-16 z-10 -mx-4 px-4 bg-gradient-to-br from-getigne-50 to-getigne-100 py-3 mb-6 border-b border-getigne-100">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {programItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          activeSectionId === item.id
                            ? 'bg-getigne-accent text-white border-transparent'
                            : 'bg-white text-getigne-700 border-getigne-200'
                        }`}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-12 text-center"> 
                <h2 className="text-3xl font-bold text-getigne-900 mb-2">
                  {shouldDisplayCounter ? `Nos ${validatedPointsCount} mesures pour Gétigné` : 'Nos mesures pour Gétigné'}
                </h2>
                <p className="text-getigne-700">
                  Découvrez les mesures concrètes que nous proposons pour Gétigné, classés par thématique et réagissez en commentant..
                </p>
              </div>

              {/* Grille avec barre latérale gauche (desktop) et contenu principal */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <aside className="hidden lg:block lg:col-span-3">
                  <div className="sticky top-24 space-y-4">
                    <nav className="space-y-2">
                      {programItems?.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => scrollToSection(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md border transition-all ${
                            activeSectionId === item.id
                              ? 'bg-getigne-accent text-white border-transparent shadow'
                              : 'bg-white text-getigne-800 border-getigne-200 hover:bg-getigne-50'
                          }`}
                        >
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-md ${
                            activeSectionId === item.id ? 'bg-white/20' : 'bg-getigne-100'
                          }`}>
                            <DynamicIcon name={item.icon} className={`w-5 h-5 ${activeSectionId === item.id ? 'text-white' : 'text-getigne-700'}`} />
                          </span>
                          <span className="text-left line-clamp-2">{item.title}</span>
                        </button>
                      ))}
                    </nav>

                    {/* CTA dans la sidebar */}
                    {programGeneral?.file && (
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
                    )}
                  </div>
                </aside>
                <main className="lg:col-span-9 space-y-10">
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
                      id={`section-${item.id}`}
                      data-section-id={item.id}
                      className="scroll-mt-24"
                    >
                      <div className="bg-white rounded-lg border border-getigne-200 overflow-hidden shadow">
                        <div className="p-6 md:p-8">
                          <div className="flex items-start gap-4 items-center">
                            <div className="p-3 bg-getigne-50 rounded-lg">
                              <DynamicIcon name={item.icon} className="w-6 h-6 text-getigne-700" />
                            </div>
                            <div className="flex-1">
                              <h2 className="text-2xl font-bold text-getigne-900 ">{item.title}</h2>
                            </div>
                            <div className="hidden md:block">
                              <ProgramLikeButton programId={item.id} />
                            </div>
                          </div>

                          {item.image && (
                            <div className="mt-6">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-56 md:h-72 object-cover rounded-md border border-getigne-100"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                              />
                            </div>
                          )}

                          {hasDescriptionContent && (
                            <div className="mt-6">
                              <EditorJSRenderer
                                data={item.description ?? ''}
                                className="prose max-w-none rich-content text-getigne-800"
                              />
                            </div>
                          )}

                          {item.content && (
                            <div className="prose max-w-none rich-content mt-6">
                              <div dangerouslySetInnerHTML={{ __html: item.content }} />
                            </div>
                          )}
                          {showAdminControls ? (
                            <div className="mt-8">
                              <h3 className="text-lg font-semibold text-getigne-900 border-b border-getigne-200 pb-2">
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
                              <div className="mt-8 space-y-4">
                                <h3 className="text-lg font-semibold text-getigne-900 border-b border-getigne-200 pb-2">
                                  Points du programme
                                </h3>
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

                          <div className="mt-8 pt-6 border-t border-getigne-200">
                            <div className="flex items-center space-x-4 text-sm text-getigne-600">
                              <MessageSquare className="w-4 h-4" />
                              <span>Participez à l'élaboration de ce thème</span>
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
              <div className="my-12">
                <Card className="border-getigne-100 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-white to-gray-100">
                    <CardTitle className="text-2xl text-getigne-900">Les étapes de l'élaboration de ce programme</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                  <ProgramTimeline 
                    mini={false}
                    showToggle={false}
                    steps={steps}
                  />
                  </CardContent>
                </Card>
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

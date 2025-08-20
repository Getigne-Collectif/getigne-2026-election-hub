
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, MessageSquare, Heart, Users, Target, BookOpen, FileDown } from 'lucide-react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProgramCommentsSection from '@/components/program/ProgramCommentsSection';
import ProgramLikeButton from '@/components/program/ProgramLikeButton';
import ProgramPointCard from '@/components/program/ProgramPointCard';
import { useAppSettings } from '@/hooks/useAppSettings';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Program from '@/components/Program';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { downloadFileFromUrl, downloadFromSupabasePath } from '@/lib/utils';
import CtaBanner from '@/components/ui/cta-banner';
import type { Tables } from '@/integrations/supabase/types';
import type { ProgramPoint } from '@/types/program.types';

type ProgramItemWithPoints = Tables<'program_items'> & {
  program_points: Tables<'program_points'>[];
};

const ProgramPage = () => {
  const { user, isAdmin, userRoles } = useAuth();
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
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

  const { data: programGeneral, isLoading: isLoadingGeneral } = useQuery({
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

  const { data: programItems, isLoading: isLoadingItems } = useQuery<ProgramItemWithPoints[]>({
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
            program_item_id
          )
        `)
        .order('created_at');

      if (error) throw error;

      return (data || []).map((item) => ({
        ...item,
        program_points:
          ((item as unknown as { program_points?: Tables<'program_points'>[] | null }).program_points
            ?.sort((a, b) => a.position - b.position)) || [],
      }));
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
              <div className="max-w-4xl mx-auto text-center">
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <div className="mb-6">
                    <Target className="w-16 h-16 mx-auto text-getigne-accent mb-4" />
                    <h1 className="text-3xl font-bold text-getigne-900 mb-4">
                      Programme Objectif 2026
                    </h1>
                    <p className="text-lg text-gray-600">
                      Le programme de Gétigné Collectif est en cours de finalisation et sera bientôt disponible.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-getigne-700">
                      <Users className="w-5 h-5" />
                      <span>Élaboré de manière participative</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-getigne-700">
                      <BookOpen className="w-5 h-5" />
                      <span>Basé sur vos contributions</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-getigne-700">
                      <Target className="w-5 h-5" />
                      <span>Orienté vers l'action concrète</span>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-4 bg-getigne-50 rounded-lg">
                    <p className="text-sm text-getigne-800">
                      Restez informé de l'avancement et de la publication du programme en vous abonnant à notre newsletter.
                    </p>
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
                {isProgramAdmin && (
                  <div className="mt-6">
                    <Button asChild>
                      <a href="/admin/program">
                        Administrer le programme
                      </a>
                    </Button>
                  </div>
                )}
              </div>

              {programGeneral && (
                <div className="mb-12">
                  <Card className="border-getigne-accent shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-getigne-accent to-cyan-500 text-white">
                      <CardTitle className="text-2xl">Présentation générale</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {programGeneral.content || ''}
                      </ReactMarkdown>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Bandeau fort et différenciant pour introduire le programme */}
              <div className="relative mb-12 overflow-hidden rounded-xl bg-gradient-to-r from-getigne-accent to-cyan-500 text-white">
                <div className="px-6 py-10 md:px-10 md:py-14">
                  <div className="max-w-4xl">
                    <p className="uppercase tracking-wider text-white/90 text-sm mb-2">Un projet collectif et vivant</p>
                    <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
                      Un programme ambitieux, réfléchi et participatif
                    </h2>
                    <p className="text-white/90 text-lg md:text-xl">
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
                  {programItems?.map((item) => (
                    <section
                      key={item.id}
                      id={`section-${item.id}`}
                      data-section-id={item.id}
                      className="scroll-mt-24"
                    >
                      <div className="bg-white rounded-lg border border-getigne-200 overflow-hidden shadow">
                        <div className="p-6 md:p-8">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-getigne-50 rounded-lg">
                              <DynamicIcon name={item.icon} className="w-6 h-6 text-getigne-700" />
                            </div>
                            <div className="flex-1">
                              <h2 className="text-2xl font-bold text-getigne-900">{item.title}</h2>
                              <p className="text-getigne-700 mt-2">{item.description}</p>
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

                          {item.content && (
                            <div className="prose max-w-none rich-content mt-6">
                              <div dangerouslySetInnerHTML={{ __html: item.content }} />
                            </div>
                          )}

                          {item.program_points && item.program_points.length > 0 && (
                            <div className="mt-8 space-y-4">
                              <h3 className="text-lg font-semibold text-getigne-900 border-b border-getigne-200 pb-2">
                                Points du programme
                              </h3>
                              {item.program_points.map((point: Tables<'program_points'>) => {
                                const normalizedPoint: ProgramPoint = {
                                  id: point.id,
                                  title: point.title as unknown as string,
                                  content: point.content as unknown as string,
                                  position: point.position,
                                  program_item_id: point.program_item_id,
                                  files: Array.isArray(point.files) ? (point.files as string[]) : [],
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
                  ))}

                </main>
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

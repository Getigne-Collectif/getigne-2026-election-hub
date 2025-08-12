
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, MessageSquare, Heart, Users, Target, BookOpen } from 'lucide-react';
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

const ProgramPage = () => {
  const { user, isAdmin, userRoles } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { settings } = useAppSettings();

  const canAccessProgram = 
    settings.showProgram || 
    userRoles.includes('admin') || 
    userRoles.includes('program_manager');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
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

  const { data: programItems, isLoading: isLoadingItems } = useQuery({
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

      return data?.map(item => ({
        ...item,
        program_points: item.program_points?.sort((a: any, b: any) => a.position - b.position) || []
      })) || [];
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

              <div className="space-y-8">
                {programItems?.map((item) => {
                  const isExpanded = expandedItems.includes(item.id);
                  const itemLikes = userLikes?.filter(like => like.program_item_id === item.id && !like.program_point_id) || [];
                  const isLiked = itemLikes.length > 0;

                  return (
                    <Card key={item.id} className="border-getigne-200 shadow-lg overflow-hidden">
                      <CardHeader 
                        className="cursor-pointer bg-gradient-to-r from-getigne-100 to-getigne-50 hover:from-getigne-150 hover:to-getigne-100 transition-all duration-200"
                        onClick={() => toggleItemExpansion(item.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white rounded-lg shadow-sm">
                              <div className="w-8 h-8 text-getigne-600">
                                <Target className="w-full h-full" />
                              </div>
                            </div>
                            <div>
                              <CardTitle className="text-xl text-getigne-900">{item.title}</CardTitle>
                              <p className="text-getigne-700 mt-1">{item.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <ProgramLikeButton
                              programId={item.id}
                            />
                            {isExpanded ? (
                              <ChevronDown className="w-6 h-6 text-getigne-600" />
                            ) : (
                              <ChevronRight className="w-6 h-6 text-getigne-600" />
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="p-8 bg-white">
                          {item.content && (
                            <div className="mb-8">
                              <div dangerouslySetInnerHTML={{ __html: item.content }} />
                            </div>
                          )}

                          {item.program_points && item.program_points.length > 0 && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-getigne-900 border-b border-getigne-200 pb-2">
                                Points du programme
                              </h3>
                              {item.program_points.map((point: any) => {
                                const pointLikes = userLikes?.filter(like => like.program_point_id === point.id) || [];
                                const isPointLiked = pointLikes.length > 0;

                                return (
                                  <ProgramPointCard
                                    key={point.id}
                                    point={point}
                                    programItemId={item.id}
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
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
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

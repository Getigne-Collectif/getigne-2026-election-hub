
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ThumbsUp, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import ProgramLikeButton from './ProgramLikeButton';
import ProgramPointCard from './ProgramPointCard';
import ProgramCommentsSection from './ProgramCommentsSection';

interface ProgramContentComponentProps {
  programItemId: string;
  value: string;
}

export default function ProgramContentComponent({ programItemId, value }: ProgramContentComponentProps) {
  const [programPoints, setProgramPoints] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);

  // Fetch program item details
  const { data: programItem, isLoading: isLoadingItem } = useQuery({
    queryKey: ['programItemDetail', programItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_items')
        .select('*')
        .eq('id', programItemId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!programItemId,
  });

  // Fetch program points
  const { isLoading: isLoadingPoints } = useQuery({
    queryKey: ['programPoints', programItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_points')
        .select('*')
        .eq('program_item_id', programItemId)
        .order('position', { ascending: true });
        
      if (error) throw error;
      setProgramPoints(data || []);
      return data;
    },
    enabled: !!programItemId,
  });

  useEffect(() => {
    // Reset comments visibility when changing tabs
    setShowComments(false);
  }, [programItemId]);

  if (isLoadingItem || isLoadingPoints) {
    return (
      <TabsContent value={value} className="min-h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-getigne-500" />
          <p className="text-getigne-600">Chargement des propositions...</p>
        </div>
      </TabsContent>
    );
  }

  if (!programItem) {
    return (
      <TabsContent value={value} className="min-h-[300px] flex items-center justify-center">
        <p>Contenu non disponible</p>
      </TabsContent>
    );
  }

  return (
    <TabsContent value={value} className="space-y-6 animate-fade-in">
      <div>
        {/* En-tête avec titre et actions */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-getigne-800 mb-2">{programItem.title}</h2>
            <div className="flex items-center gap-4">
              <ProgramLikeButton programItemId={programItemId} />
              <Button 
                variant="ghost" 
                className="text-getigne-600 flex items-center gap-2" 
                onClick={() => setShowComments(!showComments)}
              >
                <MessageSquare className="h-5 w-5" />
                {showComments ? "Masquer les commentaires" : "Commenter"}
              </Button>
            </div>
          </div>
          
          <div className="md:max-w-xs rounded-lg bg-getigne-50 p-4 border border-getigne-100">
            <h4 className="font-semibold text-getigne-800 mb-2">Thématique clé</h4>
            <p className="text-getigne-700 text-sm">
              {programItem.title} est un axe essentiel de notre programme pour améliorer 
              la qualité de vie à Gétigné et préparer l'avenir de notre commune.
            </p>
          </div>
        </div>
      
        {/* Description avec style amélioré */}
        <div className="prose max-w-none mb-12 rich-content bg-white rounded-xl p-6 shadow-sm border border-getigne-100" dangerouslySetInnerHTML={{ __html: programItem.description }} />
        
        {/* Section des propositions */}
        <div className="my-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 rounded-full bg-getigne-accent/10 flex items-center justify-center">
              <ThumbsUp className="h-5 w-5 text-getigne-accent" />
            </div>
            <h3 className="text-2xl font-bold text-getigne-800">Nos propositions concrètes</h3>
          </div>
          
          {programPoints.length === 0 ? (
            <div className="bg-getigne-50 border border-getigne-100 rounded-lg p-8 text-center">
              <p className="text-getigne-700 italic mb-2">
                Les propositions de cette section sont en cours d'élaboration.
              </p>
              <p className="text-sm text-getigne-600">
                Revenez prochainement pour découvrir nos engagements concrets sur cette thématique.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {programPoints.map((point, index) => (
                <ProgramPointCard 
                  key={point.id} 
                  point={point} 
                  programItemId={programItemId} 
                  icon={programItem.icon}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Banner avec citation en rapport avec la thématique */}
        <div className="bg-gradient-to-r from-getigne-green-500 to-[#62FCD3] text-white py-10 px-8 rounded-xl my-12 relative overflow-hidden">
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
            <blockquote className="text-xl md:text-2xl italic font-medium max-w-3xl mx-auto text-center mb-6">
              " Ensemble, nous avons le pouvoir de transformer notre commune et de créer un avenir plus durable et solidaire. "
            </blockquote>
            <p className="text-center text-white/80">L'équipe Gétigné Collectif</p>
          </div>
        </div>
        
        {/* Section commentaires */}
        {showComments && (
          <div className="mt-8 mb-4">
            <Separator className="my-8" />
            <h3 className="text-xl font-bold mb-6">Commentaires et réactions</h3>
            <ProgramCommentsSection programItemId={programItemId} />
          </div>
        )}
      </div>
    </TabsContent>
  );
}

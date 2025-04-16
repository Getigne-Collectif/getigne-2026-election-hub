
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
import placeholder from '/placeholder.svg';

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
      console.log(`[ProgramContent] Fetching program item details: ${programItemId}`);
      const { data, error } = await supabase
        .from('program_items')
        .select('*')
        .eq('id', programItemId)
        .single();

      if (error) {
        console.error("[ProgramContent] Error fetching program item:", error);
        throw error;
      }
      
      console.log("[ProgramContent] Program item loaded:", data);
      return data;
    },
    enabled: !!programItemId,
  });

  // Fetch program points
  const { isLoading: isLoadingPoints } = useQuery({
    queryKey: ['programPoints', programItemId],
    queryFn: async () => {
      console.log(`[ProgramContent] Fetching program points for item: ${programItemId}`);
      const { data, error } = await supabase
        .from('program_points')
        .select('*')
        .eq('program_item_id', programItemId)
        .order('position', { ascending: true });

      if (error) {
        console.error("[ProgramContent] Error fetching program points:", error);
        throw error;
      }
      
      console.log(`[ProgramContent] Loaded ${data?.length || 0} program points`);
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

  // Check if there's an image and log it
  if (programItem.image) {
    console.log(`[ProgramContent] Section image found: ${programItem.image}`);
  } else {
    console.log("[ProgramContent] No section image found, using placeholder");
  }

  return (
    <TabsContent value={value} className="space-y-6 animate-fade-in">
      <div>
        {/* En-tête avec titre et actions */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-getigne-800 mb-2">{programItem.title}</h2>
            <div className="flex items-center gap-4">
              <ProgramLikeButton programId={programItemId} />
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
        </div>

        {/* Image de la section si disponible */}
        {programItem.image && (
          <div className="mb-8">
            <img 
              src={programItem.image} 
              alt={programItem.title} 
              className="rounded-xl w-full max-h-[400px] object-cover"
              onError={(e) => {
                console.error(`[ProgramContent] Image failed to load: ${programItem.image}`);
                // @ts-ignore
                e.target.src = placeholder;
              }}
            />
          </div>
        )}

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

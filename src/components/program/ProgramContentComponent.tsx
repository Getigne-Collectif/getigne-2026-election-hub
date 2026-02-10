
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
import CommentCountBadge from '../comments/CommentCountBadge';
import { getUnreadCommentCount } from '@/utils/commentViews';
import { useAuth } from '@/context/auth';
import placeholder from '/placeholder.svg';

interface ProgramContentComponentProps {
  programItemId: string;
  value: string;
}

export default function ProgramContentComponent({ programItemId, value }: ProgramContentComponentProps) {
  const { user } = useAuth();
  const [programPoints, setProgramPoints] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Fetch program item details
  const { data: programItem, isLoading: isLoadingItem } = useQuery({
    queryKey: ['programItemDetail', programItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_items')
        .select('*')
        .eq('id', programItemId)
        .single();

      if (error) {
        console.error("[ProgramContent] Error fetching program item:", error);
        throw error;
      }
      
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

      if (error) {
        console.error("[ProgramContent] Error fetching program points:", error);
        throw error;
      }
      
      setProgramPoints(data || []);
      return data;
    },
    enabled: !!programItemId,
  });

  useEffect(() => {
    // Reset comments visibility when changing tabs
    setShowComments(false);
    setUnreadCount(0);
  }, [programItemId]);

  // Fetch comment count
  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const { count, error } = await supabase
          .from('program_comments')
          .select('*', { count: 'exact', head: true })
          .eq('program_item_id', programItemId)
          .is('program_point_id', null)
          .eq('status', 'approved');
          
        if (!error && count !== null) {
          setCommentCount(count);
          
          // Récupérer le nombre de commentaires non lus
          if (user && count > 0) {
            const unread = await getUnreadCommentCount(
              programItemId,
              'program',
              user.id
            );
            setUnreadCount(unread);
          }
        }
      } catch (error) {
        console.error('Error fetching comment count:', error);
      }
    };

    if (programItemId) {
      fetchCommentCount();
    }
  }, [programItemId, user]);

  // Réinitialiser le badge quand la section se ferme
  useEffect(() => {
    if (!showComments) {
      setUnreadCount(0);
    }
  }, [showComments]);

  if (isLoadingItem || isLoadingPoints) {
    return (
      <TabsContent value={value} className="min-h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-brand-600">Chargement des propositions...</p>
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
  } else {
  }

  return (
    <TabsContent value={value} className="space-y-6 animate-fade-in">
      <div>
        {/* En-tête avec titre et actions */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-brand-800 mb-2">{programItem.title}</h2>
            <div className="flex items-center gap-4">
              <ProgramLikeButton programId={programItemId} />
              <Button
                variant="ghost"
                className="text-brand-600 flex items-center gap-2"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageSquare className="h-5 w-5" />
                {showComments ? "Masquer les commentaires" : "Commenter"}
                {commentCount > 0 && (
                  <CommentCountBadge
                    totalCount={commentCount}
                    unreadCount={unreadCount}
                    showIcon={false}
                  />
                )}
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
        <div className="prose max-w-none mb-12 rich-content bg-white rounded-xl p-6 shadow-sm border border-brand-100" dangerouslySetInnerHTML={{ __html: programItem.description }} />

        {/* Section des propositions */}
        <div className="my-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
              <ThumbsUp className="h-5 w-5 text-brand" />
            </div>
            <h3 className="text-2xl font-bold text-brand-800">Nos propositions concrètes</h3>
          </div>

          {programPoints.length === 0 ? (
            <div className="bg-brand-50 border border-brand-100 rounded-lg p-8 text-center">
              <p className="text-brand-700 italic mb-2">
                Les propositions de cette section sont en cours d'élaboration.
              </p>
              <p className="text-sm text-brand-600">
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

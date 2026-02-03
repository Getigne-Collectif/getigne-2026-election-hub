import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileDown, Paperclip, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import ProgramLikeButton from './ProgramLikeButton';
import Comments from '../comments';
import EditorJSRenderer from '@/components/EditorJSRenderer';
import { ProgramPoint, ProgramPointFileMeta } from '@/types/program.types';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { supabase } from '@/integrations/supabase/client';
import CommentCountBadge from '../comments/CommentCountBadge';
import { getUnreadCommentCount } from '@/utils/commentViews';
import { useAuth } from '@/context/auth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProgramPointCardProps {
  point: ProgramPoint;
  programItemId: string;
  icon?: string;
}

export default function ProgramPointCard({ point, programItemId, icon }: ProgramPointCardProps) {
  const { user } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [likeCount, setLikeCount] = useState<number>(0);

  // Réinitialiser le badge quand la section se ferme
  useEffect(() => {
    if (!showContent) {
      setUnreadCount(0);
    }
  }, [showContent]);

  // Ouvrir automatiquement si on arrive via un maillage (hash dans l'URL)
  useEffect(() => {
    const pointId = `program-point-${point.id}`;
    const hash = window.location.hash.substring(1);
    
    if (hash === pointId) {
      // Attendre un peu que le scroll soit terminé avant d'ouvrir
      setTimeout(() => {
        setShowContent(true);
      }, 500);
    }
  }, [point.id]);

  const downloadFile = (fileUrl: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.download = fileUrl.split('/').pop() || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch comment and like counts
  useEffect(() => {
    if (point.id) {
      // Fetch comment count
      const fetchCommentCount = async () => {
        try {
          const { count, error } = await supabase
            .from('program_comments')
            .select('*', { count: 'exact', head: true })
            .eq('program_point_id', point.id)
            .eq('status', 'approved');
            
          if (!error && count !== null) {
            setCommentCount(count);
            
            // Récupérer le nombre de commentaires non lus
            if (user && count > 0) {
              const unread = await getUnreadCommentCount(
                programItemId,
                'program',
                user.id,
                point.id
              );
              setUnreadCount(unread);
            }
          }
        } catch (error) {
          console.error('Error fetching comment count:', error);
        }
      };

      // Fetch like count
      const fetchLikeCount = async () => {
        try {
          const { count, error } = await supabase
            .from('program_likes')
            .select('*', { count: 'exact', head: true })
            .eq('program_item_id', programItemId);
            
          if (!error && count !== null) {
            setLikeCount(count);
          }
        } catch (error) {
          console.error('Error fetching like count:', error);
        }
      };

      fetchCommentCount();
      fetchLikeCount();
    }
  }, [point.id, programItemId]);

  const filesToRender: ProgramPointFileMeta[] =
    (point.files_metadata && point.files_metadata.length > 0
      ? point.files_metadata
      : (point.files || []).map((url) => ({
          url,
          label: url.split('/').pop() || 'Fichier',
          path: null,
        }))) as ProgramPointFileMeta[];

  return (
    <Card 
      key={point.id} 
      id={`program-point-${point.id}`} 
      className="border-getigne-200 hover:border-getigne-accent hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={() => setShowContent(!showContent)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {point.competent_entity && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-getigne-200 bg-white">
                      {point.competent_entity.logo_url ? (
                        <img
                          src={point.competent_entity.logo_url}
                          alt={`Logo ${point.competent_entity.name}`}
                          className="h-full w-full object-contain"
                          onError={(event) => {
                            (event.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-getigne-50 text-sm font-semibold uppercase text-getigne-600">
                          {((point.competent_entity?.name ?? '').slice(0, 2) || '??').toUpperCase()}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>{point.competent_entity.name}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {point.number != null && (
                  <span className="shrink-0 text-sm font-medium text-getigne-600 tabular-nums" aria-label={`Mesure #${point.number}`}>
                    #{point.number}
                  </span>
                )}
                {point.number != null && <span className="text-getigne-300 select-none">·</span>}
                <h3 className="text-lg font-semibold text-getigne-800">
                  {point.title}
                </h3>
              </div>
              {/* Badge de nouveaux commentaires sous le titre */}
              {!showContent && commentCount > 0 && (
                <div className="mt-1">
                  <CommentCountBadge
                    totalCount={commentCount}
                    unreadCount={unreadCount}
                    showIcon={false}
                  />
                  
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                showContent 
                  ? 'bg-getigne-accent/10 text-getigne-accent' 
                  : 'bg-gray-100 text-gray-400 group-hover:bg-getigne-accent/10 group-hover:text-getigne-accent'
              }`}
            >
              {!showContent ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </div>
        
        <div
          className={`grid mt-4 transition-all duration-300 ease-in-out ${
            showContent ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="prose max-w-none rich-content mb-4">
              <EditorJSRenderer 
                data={point.content}
              />
            </div>

            {filesToRender.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="h-4 w-4 text-getigne-accent" />
                  <h4 className="text-sm font-semibold text-getigne-900 uppercase tracking-wide">
                    Fichiers attachés
                  </h4>
                </div>
                <div className="space-y-3">
                  {filesToRender.map((fileMeta, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-getigne-accent/30 bg-getigne-accent/10 px-4 py-3"
                    >
                      <span className="text-sm font-medium text-getigne-900 truncate">
                        {fileMeta.label}
                      </span>
                      <Button
                        size="sm"
                        className="bg-getigne-accent text-white hover:bg-getigne-accent/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(fileMeta.url);
                        }}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-4">
              <ProgramLikeButton 
                programId={programItemId}
                programPointId={point.id}
              />
            </div>

            {/* Commentaires affichés seulement en mode ouvert pour limiter le coût */}
            {showContent && (
              <div className="mt-4 pt-4 border-t border-getigne-100">
                <Comments 
                  programItemId={programItemId} 
                  programPointId={point.id}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

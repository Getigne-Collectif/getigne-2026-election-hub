
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import ProgramLikeButton from './ProgramLikeButton';
import Comments from '../comments';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ProgramPoint } from '@/types/program.types';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { supabase } from '@/integrations/supabase/client';

interface ProgramPointCardProps {
  point: ProgramPoint;
  programItemId: string;
  icon?: string;
}

export default function ProgramPointCard({ point, programItemId, icon }: ProgramPointCardProps) {
  const [showContent, setShowContent] = useState(false);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [likeCount, setLikeCount] = useState<number>(0);

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

  return (
    <Card key={point.id} className="border-getigne-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {icon && <DynamicIcon name={icon} size={20} className="text-getigne-600" />}
            <h3 className="text-lg font-semibold text-getigne-800">{point.title}</h3>
          </div>
          <div className="flex items-center gap-3">
            {/* Show counts */}
            <div className="flex items-center gap-2 text-sm text-getigne-500">
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-1" />
                <span>{commentCount}</span>
              </div>
              <div className="flex items-center">
                <span className="text-getigne-accent">{likeCount}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowContent(!showContent)}
            >
              {showContent ? 'Masquer' : 'Développer'}
            </Button>
          </div>
        </div>
        
        {showContent && (
          <>
            <div className="prose max-w-none rich-content mb-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{point.content}</ReactMarkdown>
            </div>

            {point.files && point.files.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Fichiers attachés</h4>
                <div className="space-y-2">
                  {point.files.map((fileUrl, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <span className="text-sm truncate">{fileUrl.split('/').pop()}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => downloadFile(fileUrl)}
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

            {/* Display comments directly when content is expanded */}
            <div className="mt-4 pt-4 border-t border-getigne-100">
              <Comments 
                programItemId={programItemId} 
                programPointId={point.id}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

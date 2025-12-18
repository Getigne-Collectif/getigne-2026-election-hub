import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, ChevronDown, ChevronUp, FileText, LogIn, UserPlus } from 'lucide-react';
import EditorJSRenderer from '@/components/EditorJSRenderer';
import ProgramLikeButton from './ProgramLikeButton';
import ProgramCommentsSection from './ProgramCommentsSection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { useToast } from '@/components/ui/use-toast';
import AuthModal from '@/components/auth/AuthModal';
import CommentCountBadge from '../comments/CommentCountBadge';
import { getUnreadCommentCount } from '@/utils/commentViews';

interface ProgramPointPreviewProps {
  point: {
    id: string;
    title: string;
    content: any;
    files?: string[];
  };
  programItemId: string;
  icon?: string;
}

const ProgramPointPreview: React.FC<ProgramPointPreviewProps> = ({
  point,
  programItemId,
  icon,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showContent, setShowContent] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Réinitialiser le badge quand la section se ferme
  useEffect(() => {
    if (!showContent) {
      setUnreadCount(0);
    }
  }, [showContent]);

  useEffect(() => {
    if (user) {
      fetchCommentCount();
      fetchLikeCount();
    }
  }, [user, point.id]);

  const fetchCommentCount = async () => {
    try {
      const { count, error } = await supabase
        .from('program_comments')
        .select('*', { count: 'exact' })
        .eq('program_point_id', point.id)
        .eq('status', 'approved');

      if (error) throw error;
      const totalCount = count || 0;
      setCommentCount(totalCount);
      
      // Récupérer le nombre de commentaires non lus
      if (user && totalCount > 0 && programItemId) {
        const unread = await getUnreadCommentCount(
          programItemId,
          'program',
          user.id,
          point.id
        );
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching comment count:', err);
    }
  };

  const fetchLikeCount = async () => {
    try {
      const { count, error } = await supabase
        .from('program_likes')
        .select('*', { count: 'exact' })
        .eq('program_point_id', point.id);

      if (error) throw error;
      setLikeCount(count || 0);
    } catch (err) {
      console.error('Error fetching like count:', err);
    }
  };

  const downloadFile = async (fileUrl: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('program-files')
        .download(fileUrl);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileUrl.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le fichier',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="w-6 h-6 flex items-center justify-center">
                <i className={`${icon} text-lg`} />
              </div>
            )}
            <h3 className="text-lg font-semibold">{point.title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <ProgramLikeButton
              programId={programItemId}
              programPointId={point.id}
              initialLikes={likeCount}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowContent(!showContent)}
            >
              {showContent ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {showContent ? (
          <>
            <div className="prose max-w-none mb-4">
              <EditorJSRenderer 
                data={point.content}
              />
            </div>

            {point.files && point.files.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Fichiers joints :</h4>
                <div className="flex flex-wrap gap-2">
                  {point.files.map((fileUrl, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(fileUrl, '_blank')}
                    >
                      <FileText className="h-4 w-4" />
                      {fileUrl.split('/').pop()}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {commentCount > 0 && (
              <div className="mt-4">
                <CommentCountBadge
                  totalCount={commentCount}
                  unreadCount={unreadCount}
                  showIcon={true}
                />
              </div>
            )}

            {user ? (
              <ProgramCommentsSection
                programPointId={point.id}
                programItemId={programItemId}
              />
            ) : (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-3">
                  Vous devez être connecté pour ajouter un commentaire
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowAuthModal(true)}
                  >
                    <LogIn className="h-4 w-4" />
                    Se connecter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowAuthModal(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                    Créer un compte
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="prose prose-sm max-w-none line-clamp-1">
            <EditorJSRenderer 
              data={point.content}
              className="line-clamp-1"
            />
          </div>
        )}

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </CardContent>
    </Card>
  );
};

export default ProgramPointPreview; 
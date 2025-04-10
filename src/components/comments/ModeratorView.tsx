
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from './utils';
import { Separator } from '@/components/ui/separator';
import { Comment, CommentStatus } from '@/types/comments.types';

interface ModeratorViewProps {
  comments: Comment[];
  showAllComments: boolean;
  setShowAllComments: (show: boolean) => void;
  onModerateComment: (commentId: string, status: 'approved' | 'rejected') => Promise<void>;
  loading?: boolean;
  sourceType?: string;
}

const ModeratorView: React.FC<ModeratorViewProps> = ({ 
  comments, 
  showAllComments, 
  setShowAllComments, 
  onModerateComment,
  loading = false,
  sourceType = 'news'
}) => {
  const pendingCommentsCount = comments.filter(comment => comment.status === 'pending').length;
  
  if (loading) {
    return (
      <div className="text-center py-8 text-getigne-500">
        Chargement des commentaires...
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-getigne-500">
        {showAllComments ? "Aucun commentaire" : "Aucun commentaire en attente"}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <Button 
            variant={showAllComments ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowAllComments(true)}
          >
            Tous les commentaires
          </Button>
          <Button 
            variant={!showAllComments ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowAllComments(false)}
          >
            En attente ({pendingCommentsCount})
          </Button>
        </div>
      </div>

      <Separator className="mb-6" />

      <div className="space-y-6">
        {comments.map(comment => (
          <div
            key={comment.id}
            className={`p-4 rounded-lg ${
              comment.status === 'pending' ? 'border-l-4 border-amber-500 bg-amber-50' :
              comment.status === 'rejected' ? 'border-l-4 border-red-500 bg-red-50' :
              'border border-getigne-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                {comment.profiles?.avatar_url ? (
                  <AvatarImage src={comment.profiles.avatar_url} alt="Avatar utilisateur" />
                ) : null}
                <AvatarFallback className="bg-getigne-100 text-getigne-700">
                  {comment.profiles ? getInitials(comment.profiles.first_name, comment.profiles.last_name) : 'UN'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">
                      {comment.profiles ? `${comment.profiles.first_name} ${comment.profiles.last_name}` : 'Utilisateur inconnu'}
                    </h4>
                    <time className="text-sm text-getigne-500">
                      {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  </div>
                  
                  <div className="flex space-x-2">
                    {comment.status === 'pending' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => onModerateComment(comment.id, 'approved')}
                        >
                          <Check className="h-4 w-4" />
                          <span>Approuver</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => onModerateComment(comment.id, 'rejected')}
                        >
                          <X className="h-4 w-4" />
                          <span>Rejeter</span>
                        </Button>
                      </>
                    )}
                    
                    {comment.status === 'approved' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => onModerateComment(comment.id, 'rejected')}
                      >
                        <X className="h-4 w-4" />
                        <span>Rejeter</span>
                      </Button>
                    )}
                    
                    {comment.status === 'rejected' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => onModerateComment(comment.id, 'approved')}
                      >
                        <Check className="h-4 w-4" />
                        <span>Approuver</span>
                      </Button>
                    )}
                  </div>
                </div>
                
                <p className="mt-2 text-getigne-700">
                  {comment.content}
                </p>

                <div className="mt-2 text-sm">
                  <span className={`px-2 py-1 rounded-full ${
                    comment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    comment.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {comment.status === 'pending' ? 'En attente' :
                     comment.status === 'rejected' ? 'Rejeté' : 'Approuvé'}
                  </span>
                  <span className="ml-2 text-getigne-500">
                    • {sourceType === 'news' ? 'Article' : 
                      sourceType === 'program_point' ? 'Point de programme' : 
                      'Section de programme'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModeratorView;

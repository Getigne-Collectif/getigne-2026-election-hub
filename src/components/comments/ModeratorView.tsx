
import React from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { getInitials } from './utils';
import { Comment, CommentStatus } from '@/types/comments.types';

interface ModeratorViewProps {
  comments: Comment[];
  showAllComments: boolean;
  setShowAllComments: (show: boolean) => void;
  onModerateComment: (commentId: string, newStatus: CommentStatus) => Promise<void>;
}

const ModeratorView: React.FC<ModeratorViewProps> = ({ 
  comments, 
  showAllComments, 
  setShowAllComments, 
  onModerateComment
}) => {
  // Function to get badge props based on status
  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case 'approved':
        return { variant: 'success' as const, children: 'Approuvé', icon: Check };
      case 'rejected':
        return { variant: 'destructive' as const, children: 'Rejeté', icon: X };
      case 'pending':
      default:
        return { variant: 'secondary' as const, children: 'En attente', icon: AlertTriangle };
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Modération des commentaires</h3>
        <div className="flex items-center gap-2">
          <Switch
            checked={showAllComments}
            onCheckedChange={setShowAllComments}
            id="show-pending"
          />
          <label htmlFor="show-pending" className="text-sm text-getigne-700">
            {showAllComments ? "Tous les commentaires" : "Commentaires approuvés uniquement"}
          </label>
        </div>
      </div>

      <Table className="mb-8">
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Commentaire</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comments.length > 0 ? (
            comments.map((comment) => {
              const statusProps = getStatusBadgeProps(comment.status);
              const StatusIcon = statusProps.icon;
              
              return (
                <TableRow key={comment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 bg-getigne-100">
                        {comment.profiles?.avatar_url ? (
                          <AvatarImage src={comment.profiles.avatar_url} alt="Avatar utilisateur" />
                        ) : null}
                        <AvatarFallback className="text-getigne-700">
                          {comment.profiles ? getInitials(comment.profiles.first_name, comment.profiles.last_name) : 'UN'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{comment.profiles ? `${comment.profiles.first_name} ${comment.profiles.last_name}` : 'Utilisateur'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="line-clamp-2">{comment.content}</p>
                  </TableCell>
                  <TableCell>
                    {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusProps.variant as any}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusProps.children}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {comment.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-green-500 text-green-600 hover:bg-green-50"
                          onClick={() => onModerateComment(comment.id, 'approved')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approuver
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => onModerateComment(comment.id, 'rejected')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rejeter
                        </Button>
                      </div>
                    )}
                    {comment.status === 'approved' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() => onModerateComment(comment.id, 'rejected')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rejeter
                      </Button>
                    )}
                    {comment.status === 'rejected' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-green-500 text-green-600 hover:bg-green-50"
                        onClick={() => onModerateComment(comment.id, 'approved')}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approuver
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4 text-getigne-500">
                Aucun commentaire à modérer
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
};

export default ModeratorView;

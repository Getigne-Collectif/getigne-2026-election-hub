
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { User, MessageSquare, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Profile {
  first_name: string;
  last_name: string;
}

interface Comment {
  id: string;
  user_id: string;
  news_id: string;
  content: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  updated_at: string;
  profiles?: Profile;
}

interface CommentsProps {
  newsId: string;
}

const Comments: React.FC<CommentsProps> = ({ newsId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const { user, isModerator } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Fetching comments for news ID:', newsId);
    fetchComments();
  }, [newsId, showAllComments]);

  const fetchComments = async () => {
    try {
      let query = supabase
        .from('comments')
        .select(`
          *,
          profiles:profiles(first_name, last_name)
        `)
        .eq('news_id', newsId);

      // Si l'utilisateur n'est pas modérateur et qu'on ne montre pas tous les commentaires,
      // on filtre pour ne montrer que les commentaires approuvés
      if (!isModerator && !showAllComments) {
        query = query.eq('status', 'approved');
      }
      
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }
      
      console.log('Fetched comments:', data);
      
      // Transform the data to match our Comment interface
      const transformedData = data?.map(item => {
        // Handle profiles which might be null, an empty array, or an array with objects
        let profileData: Profile | undefined = undefined;
        
        if (item.profiles && Array.isArray(item.profiles) && item.profiles.length > 0) {
          // If profiles is a non-empty array, take the first element
          profileData = item.profiles[0];
        } else if (item.profiles && typeof item.profiles === 'object' && 'first_name' in item.profiles) {
          // If profiles is already an object with the right properties
          profileData = item.profiles as unknown as Profile;
        }
        
        return {
          ...item,
          profiles: profileData
        };
      }) || [];
      
      setComments(transformedData as Comment[]);
    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Connectez-vous pour commenter',
        description: 'Vous devez être connecté pour ajouter un commentaire',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: 'Commentaire vide',
        description: 'Veuillez entrer un commentaire',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      console.log('Submitting comment:', {
        user_id: user.id,
        news_id: newsId,
        content: newComment.trim(),
        status: 'pending' // Tous les commentaires sont en attente par défaut
      });
      
      // Insert the new comment
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .insert([
          { 
            user_id: user.id, 
            news_id: newsId, 
            content: newComment.trim(),
            status: 'pending'
          }
        ])
        .select();

      if (commentError) {
        console.error('Error inserting comment:', commentError);
        throw commentError;
      }
      
      console.log('Comment inserted:', commentData);
      
      // Fetch the profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }
      
      console.log('Profile fetched:', profileData);
      
      // Combine the comment and profile data
      const newCommentWithProfile = {
        ...commentData[0],
        profiles: profileData
      } as Comment;
      
      if (isModerator || showAllComments) {
        // Si modérateur ou affichage de tous les commentaires, ajouter au début de la liste
        setComments([newCommentWithProfile, ...comments]);
      }
      
      setNewComment('');
      toast({
        title: 'Commentaire soumis',
        description: isModerator ? 
          'Votre commentaire a été publié et est en attente de modération' : 
          'Votre commentaire a été soumis et est en attente de validation par un modérateur'
      });
      
      // Force reload comments to ensure we have the latest data
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive'
      });
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleModerateComment = async (commentId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', commentId);

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      setComments(comments.map(comment => 
        comment.id === commentId ? { ...comment, status: newStatus } : comment
      ));

      toast({
        title: newStatus === 'approved' ? 'Commentaire approuvé' : 'Commentaire rejeté',
        description: newStatus === 'approved' ? 
          'Le commentaire est maintenant visible pour tous les utilisateurs' : 
          'Le commentaire a été rejeté et ne sera pas visible publiquement'
      });
      
      // Rafraîchir les commentaires pour s'assurer que tout est à jour
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Erreur de modération',
        description: error.message || 'Une erreur est survenue lors de la modération',
        variant: 'destructive'
      });
      console.error('Error moderating comment:', error);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'UN';
  };

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

  const renderModeratorView = () => (
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
                          onClick={() => handleModerateComment(comment.id, 'approved')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approuver
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => handleModerateComment(comment.id, 'rejected')}
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
                        onClick={() => handleModerateComment(comment.id, 'rejected')}
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
                        onClick={() => handleModerateComment(comment.id, 'approved')}
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

  const renderUserView = () => (
    <div className="space-y-6">
      {comments.length > 0 ? (
        comments.map((comment) => (
          <div 
            key={comment.id} 
            className="bg-white p-5 rounded-lg shadow-sm border border-getigne-100"
          >
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-10 w-10 bg-getigne-100">
                <AvatarFallback className="text-getigne-700">
                  {comment.profiles ? getInitials(comment.profiles.first_name, comment.profiles.last_name) : 'UN'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">
                  {comment.profiles ? `${comment.profiles.first_name} ${comment.profiles.last_name}` : 'Utilisateur'}
                </h4>
                <time className="text-getigne-500 text-sm">
                  {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </time>
              </div>
            </div>
            <p className="text-getigne-700">{comment.content}</p>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-getigne-500">
          {user ? 'Soyez le premier à commenter cet article' : 'Aucun commentaire pour cet article'}
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-12 border-t border-getigne-100 pt-8">
      <h3 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6" />
        Commentaires ({comments.length})
      </h3>

      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <Textarea
            placeholder="Partagez votre avis..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-3 h-24"
          />
          <Button 
            type="submit" 
            disabled={submitting}
            className="bg-getigne-accent hover:bg-getigne-accent/90"
          >
            {submitting ? 'Publication...' : 'Publier un commentaire'}
          </Button>
          {!isModerator && (
            <p className="text-sm text-getigne-500 mt-2">
              Note: Votre commentaire sera visible après validation par un modérateur.
            </p>
          )}
        </form>
      ) : (
        <div className="bg-getigne-50 p-4 rounded-md mb-8">
          <p className="text-getigne-700 mb-3">Connectez-vous pour ajouter un commentaire</p>
          <Button 
            onClick={() => navigate('/auth')}
            className="bg-getigne-accent hover:bg-getigne-accent/90"
          >
            Se connecter / S'inscrire
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Chargement des commentaires...</div>
      ) : isModerator ? (
        renderModeratorView()
      ) : (
        renderUserView()
      )}
    </div>
  );
};

export default Comments;

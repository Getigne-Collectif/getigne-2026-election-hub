
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface CommentFormProps {
  newsId: string;
  onCommentSubmitted: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ newsId, onCommentSubmitted }) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, isModerator } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
        status: 'pending'
      });
      
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
      
      setNewComment('');
      toast({
        title: 'Commentaire soumis',
        description: isModerator ? 
          'Votre commentaire a été publié et est en attente de modération' : 
          'Votre commentaire a été soumis et est en attente de validation par un modérateur'
      });
      
      onCommentSubmitted();
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

  if (!user) {
    return (
      <div className="bg-getigne-50 p-4 rounded-md mb-8">
        <p className="text-getigne-700 mb-3">Connectez-vous pour ajouter un commentaire</p>
        <Button 
          onClick={() => navigate('/auth')}
          className="bg-getigne-accent hover:bg-getigne-accent/90"
        >
          Se connecter / S'inscrire
        </Button>
      </div>
    );
  }

  return (
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
  );
};

export default CommentForm;

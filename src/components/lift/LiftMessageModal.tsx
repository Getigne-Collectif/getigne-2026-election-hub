
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { toast } from '@/hooks/use-toast';

interface LiftMessageModalProps {
  post: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LiftMessageModal: React.FC<LiftMessageModalProps> = ({ 
  post, 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [postOwner, setPostOwner] = useState<any>(null);

  useEffect(() => {
    if (isOpen && post) {
      fetchPostOwner();
    }
  }, [isOpen, post]);

  const fetchPostOwner = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', post.user_id)
        .single();

      if (error) throw error;
      setPostOwner(data);
    } catch (error) {
      console.error('Error fetching post owner:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;

    setLoading(true);
    try {
      // Sauvegarder le message
      const { error: messageError } = await supabase
        .from('lift_messages')
        .insert([{
          lift_post_id: post.id,
          sender_id: user.id,
          message: message.trim()
        }]);

      if (messageError) throw messageError;

      // Envoyer un email via edge function
      await supabase.functions.invoke('lift-notification', {
        body: {
          postId: post.id,
          senderId: user.id,
          message: message.trim(),
          postType: post.type
        }
      });

      toast({
        title: 'Message envoyé',
        description: 'Votre message a été envoyé avec succès.',
      });

      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'envoi du message.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStart: string, timeEnd: string, isFlexible: boolean) => {
    if (isFlexible && timeEnd) {
      return `${timeStart} - ${timeEnd}`;
    }
    return timeStart;
  };

  const getRecurrenceText = (recurrence: string) => {
    switch (recurrence) {
      case 'daily': return 'Tous les jours';
      case 'weekly': return 'Toutes les semaines';
      case 'once': return 'Une fois';
      default: return recurrence;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-orange-900">
            {post?.type === 'offer' ? 'Proposition de trajet' : 'Demande de trajet'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonne gauche - Informations du trajet */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Détails du trajet</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <MapPin size={16} className="mr-2 text-orange-600" />
                  <span>{post?.departure_location} → {post?.arrival_location}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar size={16} className="mr-2 text-orange-600" />
                  <span>{post?.day}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock size={16} className="mr-2 text-orange-600" />
                  <span>
                    {post?.time_start ? formatTime(post.time_start, post.time_end, post.is_flexible_time) : 'Horaire flexible'}
                  </span>
                </div>
              </div>

              <Badge variant="outline" className="mt-2 text-orange-700 border-orange-300">
                {getRecurrenceText(post?.recurrence)}
              </Badge>
            </div>

            {post?.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {post.description}
                </p>
              </div>
            )}

            {postOwner && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Contact</h4>
                <div className="flex items-center text-sm">
                  <User size={16} className="mr-2 text-orange-600" />
                  <span>{postOwner.first_name} {postOwner.last_name}</span>
                </div>
                {postOwner.email && (
                  <p className="text-sm text-gray-600 ml-6">{postOwner.email}</p>
                )}
              </div>
            )}
          </div>

          {/* Colonne droite - Formulaire de message */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="message">Votre message</Label>
                <textarea
                  id="message"
                  rows={8}
                  className="w-full p-3 border border-input rounded-md"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Écrivez votre message ici..."
                  required
                />
              </div>

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !message.trim()}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? 'Envoi...' : (post?.type === 'offer' ? "Ça m'intéresse" : "Je propose un covoit")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiftMessageModal;

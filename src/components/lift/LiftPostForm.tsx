import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { toast } from '@/hooks/use-toast';

interface LiftPostFormProps {
  type: 'offer' | 'request';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editPost?: any;
}

const LiftPostForm: React.FC<LiftPostFormProps> = ({ 
  type, 
  isOpen, 
  onClose, 
  onSuccess,
  editPost 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isFlexibleTime, setIsFlexibleTime] = useState(editPost?.is_flexible_time || false);
  
  const [formData, setFormData] = useState({
    recurrence: editPost?.recurrence || 'once',
    date: editPost?.date || '',
    timeStart: editPost?.time_start || '',
    timeEnd: editPost?.time_end || '',
    departureLocation: editPost?.departure_location || '',
    arrivalLocation: editPost?.arrival_location || '',
    description: editPost?.description || '',
    availableSeats: editPost?.available_seats || 1,
  });

  const getRecurrenceMessage = () => {
    if (formData.recurrence === 'weekly' && formData.date) {
      const date = new Date(formData.date);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
      return `Se répète chaque ${dayName}`;
    }
    return null;
  };

  const sendDiscordNotification = async (postData: any) => {
    try {
      const actionText = type === 'offer' ? 'proposé un trajet' : 'fait une demande de covoiturage';
      const recurrenceText = formData.recurrence === 'once' ? '' : ` (${formData.recurrence === 'weekly' ? 'hebdomadaire' : 'quotidien'})`;
      const date = new Date(formData.date);
      const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      const message = `📍 **${formData.departureLocation}** → **${formData.arrivalLocation}**\n🗓️ ${dateStr}${recurrenceText}\n⏰ ${formData.timeStart ? (isFlexibleTime && formData.timeEnd ? `${formData.timeStart} - ${formData.timeEnd}` : formData.timeStart) : 'Horaire flexible'}\n\n${formData.description ? `💬 ${formData.description}` : ''}`;

      await supabase.functions.invoke('discord-notify', {
        body: {
          title: `Nouveau ${type === 'offer' ? 'trajet proposé' : 'demande de covoiturage'}`,
          message: message,
          color: 0x00aff5,
          username: 'Lift - Covoiturage',
        }
      });
    } catch (error) {
      console.error('Erreur envoi Discord:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.date) return;

    setLoading(true);
    try {
      const date = new Date(formData.date);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });

      const postData = {
        user_id: user.id,
        type,
        date: formData.date,
        day: dayName,
        time_start: isFlexibleTime ? null : formData.timeStart || null,
        time_end: isFlexibleTime ? formData.timeEnd || null : null,
        is_flexible_time: isFlexibleTime,
        recurrence: formData.recurrence,
        departure_location: formData.departureLocation,
        arrival_location: formData.arrivalLocation,
        description: formData.description,
        available_seats: parseInt(formData.availableSeats) || 1,
        status: 'published'
      };

      let result;
      if (editPost) {
        result = await supabase
          .from('lift_posts')
          .update(postData)
          .eq('id', editPost.id);
      } else {
        result = await supabase
          .from('lift_posts')
          .insert([postData]);
      }

      if (result.error) throw result.error;

      if (!editPost) {
        await sendDiscordNotification(postData);
      }

      toast({
        title: editPost ? 'Annonce modifiée' : 'Annonce créée',
        description: editPost ? 'Votre annonce a été modifiée avec succès.' : 'Votre annonce a été créée avec succès.',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editPost || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('lift_posts')
        .update({ status: 'deleted' })
        .eq('id', editPost.id);

      if (error) throw error;

      toast({
        title: 'Annonce supprimée',
        description: 'Votre annonce a été supprimée avec succès.',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-blue-900">
            {editPost ? 'Modifier' : (type === 'offer' ? 'Proposer un trajet' : 'Faire une demande')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="recurrence">Type</Label>
              <Select value={formData.recurrence} onValueChange={(value) => setFormData(prev => ({ ...prev, recurrence: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Une fois</SelectItem>
                  <SelectItem value="daily">Tous les jours</SelectItem>
                  <SelectItem value="weekly">Toutes les semaines</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
                min={new Date().toISOString().split('T')[0]}
              />
              {getRecurrenceMessage() && (
                <p className="text-sm text-blue-600 mt-1">{getRecurrenceMessage()}</p>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id="flexible"
                  checked={isFlexibleTime}
                  onCheckedChange={(checked) => setIsFlexibleTime(checked as boolean)}
                />
                <Label htmlFor="flexible">Flexible sur les horaires</Label>
              </div>

              {isFlexibleTime ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="timeStart">Heure de début</Label>
                    <Input
                      id="timeStart"
                      type="time"
                      value={formData.timeStart}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeStart: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeEnd">Heure de fin</Label>
                    <Input
                      id="timeEnd"
                      type="time"
                      value={formData.timeEnd}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeEnd: e.target.value }))}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="timeStart">Heure</Label>
                  <Input
                    id="timeStart"
                    type="time"
                    value={formData.timeStart}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeStart: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="departure">Lieu de départ</Label>
              <Input
                id="departure"
                value={formData.departureLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, departureLocation: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="arrival">Lieu d'arrivée</Label>
              <Input
                id="arrival"
                value={formData.arrivalLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, arrivalLocation: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="seats">
                {type === 'offer' ? 'Places disponibles' : 'Places nécessaires'}
              </Label>
              <Input
                id="seats"
                type="number"
                min="1"
                max="8"
                value={formData.availableSeats}
                onChange={(e) => setFormData(prev => ({ ...prev, availableSeats: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={15}
                className="w-full p-2 border border-input rounded-md resize-none"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Détails complémentaires..."
              />
            </div>

            <div className="flex justify-between pt-4">
              {editPost && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Supprimer
                </Button>
              )}
              <div className="flex space-x-2 ml-auto">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !formData.date}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'En cours...' : (editPost ? 'Modifier' : 'Publier')}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LiftPostForm;

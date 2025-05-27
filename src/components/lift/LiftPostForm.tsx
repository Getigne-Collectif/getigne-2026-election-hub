
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { sendDiscordNotification, DiscordColors } from '@/utils/notifications';

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    editPost?.date ? new Date(editPost.date) : undefined
  );
  
  const [formData, setFormData] = useState({
    recurrence: editPost?.recurrence || 'once',
    timeStart: editPost?.time_start || '',
    timeEnd: editPost?.time_end || '',
    departureLocation: editPost?.departure_location || '',
    arrivalLocation: editPost?.arrival_location || '',
    description: editPost?.description || '',
  });

  const getDayName = (date: Date) => {
    return format(date, 'EEEE', { locale: fr });
  };

  const getRecurrenceMessage = () => {
    if (formData.recurrence === 'weekly' && selectedDate) {
      const dayName = getDayName(selectedDate);
      return `Se répète chaque ${dayName}`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDate) return;

    setLoading(true);
    try {
      const postData = {
        user_id: user.id,
        type,
        date: selectedDate.toISOString().split('T')[0],
        day: format(selectedDate, 'EEEE', { locale: fr }),
        time_start: isFlexibleTime ? null : formData.timeStart || null,
        time_end: isFlexibleTime ? formData.timeEnd || null : null,
        is_flexible_time: isFlexibleTime,
        recurrence: formData.recurrence,
        departure_location: formData.departureLocation,
        arrival_location: formData.arrivalLocation,
        description: formData.description,
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

      // Envoyer notification Discord pour les nouvelles annonces
      if (!editPost) {
        try {
          const actionText = type === 'offer' ? 'proposé un trajet' : 'fait une demande de covoiturage';
          const recurrenceText = formData.recurrence === 'once' ? '' : ` (${formData.recurrence === 'weekly' ? 'hebdomadaire' : 'quotidien'})`;
          
          await sendDiscordNotification({
            title: `Nouveau ${type === 'offer' ? 'trajet proposé' : 'demande de covoiturage'}`,
            message: `📍 **${formData.departureLocation}** → **${formData.arrivalLocation}**\n🗓️ ${format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}${recurrenceText}\n⏰ ${formData.timeStart ? (isFlexibleTime && formData.timeEnd ? `${formData.timeStart} - ${formData.timeEnd}` : formData.timeStart) : 'Horaire flexible'}\n\n${formData.description ? `💬 ${formData.description}` : ''}`,
            color: DiscordColors.BLUE,
            username: 'Lift - Covoiturage',
          });
        } catch (error) {
          console.error('Erreur envoi Discord:', error);
        }
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-blue-900">
            {editPost ? 'Modifier' : (type === 'offer' ? 'Proposer un trajet' : 'Faire une demande')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "EEEE d MMMM yyyy", { locale: fr }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={10}
              className="w-full p-2 border border-input rounded-md"
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
                disabled={loading || !selectedDate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'En cours...' : (editPost ? 'Modifier' : 'Publier')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LiftPostForm;

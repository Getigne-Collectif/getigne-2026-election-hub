
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';

interface EventRegistrationAdminProps {
  eventId: string;
  isAllowRegistration: boolean;
  isMembersOnly: boolean;
  onUpdate: () => void;
}

const EventRegistrationAdmin: React.FC<EventRegistrationAdminProps> = ({
  eventId,
  isAllowRegistration,
  isMembersOnly,
  onUpdate
}) => {
  const { toast } = useToast();
  const [allowRegistration, setAllowRegistration] = useState(isAllowRegistration);
  const [membersOnly, setMembersOnly] = useState(isMembersOnly);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({
          allow_registration: allowRegistration,
          is_members_only: membersOnly
        })
        .eq('id', eventId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Paramètres d\'inscription mis à jour',
        description: 'Les paramètres d\'inscription ont été mis à jour avec succès',
      });
      
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Erreur lors de la mise à jour',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-getigne-50 p-4 rounded-lg mb-6">
      <h3 className="font-medium mb-4">Paramètres d'inscription</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="allow-registration" className="font-medium">Autoriser les inscriptions</Label>
            <p className="text-sm text-getigne-500">Activez pour permettre aux utilisateurs de s'inscrire à cet événement</p>
          </div>
          <Switch 
            id="allow-registration" 
            checked={allowRegistration} 
            onCheckedChange={setAllowRegistration} 
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="members-only" className="font-medium">Réservé aux adhérents</Label>
            <p className="text-sm text-getigne-500">Activez pour limiter les inscriptions aux adhérents uniquement</p>
          </div>
          <Switch 
            id="members-only" 
            checked={membersOnly} 
            onCheckedChange={setMembersOnly} 
          />
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
};

export default EventRegistrationAdmin;

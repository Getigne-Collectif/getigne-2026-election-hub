
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface UserMembershipStatusProps {
  userId: string;
  isMember: boolean;
  onUpdate: () => void;
}

const UserMembershipStatus: React.FC<UserMembershipStatusProps> = ({
  userId,
  isMember,
  onUpdate
}) => {
  const { toast } = useToast();
  const [memberStatus, setMemberStatus] = useState(isMember);
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_member: memberStatus })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Statut d\'adhésion mis à jour',
        description: memberStatus 
          ? 'L\'utilisateur est maintenant un adhérent' 
          : 'L\'utilisateur n\'est plus un adhérent',
      });
      
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Erreur de mise à jour',
        description: error.message || 'Une erreur est survenue lors de la mise à jour',
        variant: 'destructive'
      });
      setMemberStatus(isMember); // Reset to original value on error
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Switch 
        checked={memberStatus} 
        onCheckedChange={setMemberStatus} 
        disabled={updating}
      />
      <span className="text-sm">
        {memberStatus ? 'Adhérent' : 'Non adhérent'}
      </span>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={handleUpdate}
        disabled={updating || memberStatus === isMember}
        className="ml-2 h-7"
      >
        {updating && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
        Appliquer
      </Button>
    </div>
  );
};

export default UserMembershipStatus;


import { useState } from 'react';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsForm() {
  const { settings, updateSettings, isLoading, refresh } = useAppSettings();
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const handleToggleSetting = async (key: keyof typeof settings, value: boolean) => {
    try {
      setUpdating(true);
      await updateSettings(key, value);
      toast({
        title: "Paramètre mis à jour",
        description: `Le paramètre a été modifié avec succès.`,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paramètre:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le paramètre.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres généraux</CardTitle>
        <CardDescription>
          Configurez les paramètres de visibilité et comportement du site.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-getigne-600" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <Label className="text-base font-medium">Afficher le programme</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Active la section programme sur la page d'accueil et le menu de navigation
                </p>
              </div>
              <Switch
                checked={settings.showProgram}
                onCheckedChange={(checked) => handleToggleSetting('showProgram', checked)}
                disabled={updating}
              />
            </div>
            
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <Label className="text-base font-medium">Afficher les travaux des commissions</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Rend visible publiquement les travaux des commissions ou les limite à l'équipe programme
                </p>
              </div>
              <Switch
                checked={settings.showCommitteeWorks}
                onCheckedChange={(checked) => handleToggleSetting('showCommitteeWorks', checked)}
                disabled={updating}
              />
            </div>
            
            <div className="pt-4">
              <Button 
                variant="outline" 
                onClick={() => refresh()}
                disabled={isLoading || updating}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualiser
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

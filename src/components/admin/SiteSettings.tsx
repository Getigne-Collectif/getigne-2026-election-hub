
import { useState } from 'react';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const SiteSettings = () => {
  const { settings, loading, updateSetting } = useAppSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    showProgram: false,
  });

  // Mettre à jour les paramètres locaux quand les paramètres sont chargés
  useState(() => {
    if (!loading) {
      setLocalSettings({
        showProgram: settings.showProgram,
      });
    }
  });

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSetting('showProgram', localSettings.showProgram);
      toast.success('Paramètres mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      toast.error('Erreur lors de la mise à jour des paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-getigne-accent" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres du site</CardTitle>
        <CardDescription>
          Gérer les paramètres généraux du site
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Visibilité du programme</h3>
          
          <div className="flex items-center justify-between border p-4 rounded-md">
            <div className="space-y-0.5">
              <Label htmlFor="show-program">Afficher le programme</Label>
              <p className="text-sm text-muted-foreground">
                Active l'affichage du programme pour tous les visiteurs
              </p>
            </div>
            <Switch
              id="show-program"
              checked={localSettings.showProgram}
              onCheckedChange={(checked) => 
                setLocalSettings((prev) => ({ ...prev, showProgram: checked }))
              }
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveSettings} 
          disabled={isSaving}
          className="ml-auto"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer les modifications
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SiteSettings;

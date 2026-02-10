import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link2, Copy, Check, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CardDAVInfo = () => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Pour l'instant, URL fictive - à remplacer par la vraie URL CardDAV quand elle sera disponible
  const cardDavUrl = `${window.location.origin}/carddav/annuaire/`;
  
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(cardDavUrl);
      setCopied(true);
      toast({
        title: 'Lien copié',
        description: 'Le lien CardDAV a été copié dans le presse-papier',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le lien',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Card className="border-brand-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-brand-600" />
          <CardTitle>Synchronisation CardDAV</CardTitle>
        </div>
        <CardDescription>
          Synchronisez automatiquement l'annuaire avec vos applications de contacts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Fonctionnalité à venir :</strong> La synchronisation CardDAV sera bientôt disponible. 
            Elle vous permettra de maintenir automatiquement à jour les contacts de l'annuaire dans vos 
            applications (Apple Contacts, Thunderbird, etc.).
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">URL CardDAV (prévisualisation)</label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 rounded-md border bg-muted/50 text-sm font-mono break-all">
              {cardDavUrl}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyUrl}
              disabled
              title="Disponible prochainement"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="rounded-lg bg-brand-50 p-4 space-y-2">
          <h4 className="text-sm font-semibold text-brand-900">
            Compatibilité future
          </h4>
          <ul className="text-sm text-brand-700 space-y-1 list-disc list-inside">
            <li>Apple Contacts (macOS, iOS)</li>
            <li>Thunderbird</li>
            <li>Evolution</li>
            <li>Autres clients CardDAV</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CardDAVInfo;

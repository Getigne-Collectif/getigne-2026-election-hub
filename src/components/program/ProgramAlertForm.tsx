
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { sendDiscordNotification, DiscordColors, DiscordMessageOptions } from '@/utils/notifications';

const ProgramAlertForm = () => {
  const [programAlertTitle, setProgramAlertTitle] = useState('');
  const [programAlertContent, setProgramAlertContent] = useState('');
  const [isSendingAlert, setIsSendingAlert] = useState(false);

  const handleSendAlert = async () => {
    try {
      setIsSendingAlert(true);
      
      const alertOptions: DiscordMessageOptions = {
        title: programAlertTitle || 'Alerte sur le programme',
        message: programAlertContent,
        color: DiscordColors.YELLOW,
        username: 'Programme Gétigné Collectif'
      };

      await sendDiscordNotification(alertOptions);
      
      toast.success('Alerte envoyée avec succès sur Discord !');
      setProgramAlertTitle('');
      setProgramAlertContent('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'alerte:', error);
      toast.error('Erreur lors de l\'envoi de l\'alerte. Veuillez réessayer.');
    } finally {
      setIsSendingAlert(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Envoyer une alerte</CardTitle>
        <CardDescription>
          Envoyer une notification d'alerte à tous les utilisateurs via Discord
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="alert-title">Titre de l'alerte</Label>
          <Input
            id="alert-title"
            placeholder="Titre de l'alerte"
            value={programAlertTitle}
            onChange={(e) => setProgramAlertTitle(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="alert-content">Contenu de l'alerte</Label>
          <Textarea
            id="alert-content"
            placeholder="Contenu de l'alerte"
            value={programAlertContent}
            onChange={(e) => setProgramAlertContent(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button disabled={isSendingAlert} onClick={handleSendAlert}>
          {isSendingAlert ? 'Envoi en cours...' : 'Envoyer l\'alerte'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProgramAlertForm;

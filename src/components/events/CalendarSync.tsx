
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Copy, ExternalLink } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { useToast } from '@/components/ui/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CalendarSync: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return null;

  const getCalendarUrl = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session introuvable");

      // Get production or development URL
      const baseUrl = window.location.origin.includes('localhost')
        ? "http://localhost:54321/functions/v1/calendar-sync"
        : "https://jqpivqdwblrccjzicnxn.supabase.co/functions/v1/calendar-sync";
      
      // Create a URL with the access token directly in the URL for calendar applications
      // This is a special case for calendar sync as it needs to work with external apps
      return `webcal://${baseUrl.replace(/^https?:\/\//, '')}?token=${session.access_token}`;
    } catch (error) {
      console.error("Erreur lors de la génération de l'URL du calendrier:", error);
      return null;
    }
  };

  const copyToClipboard = async () => {
    setIsLoading(true);
    try {
      const url = await getCalendarUrl();
      if (!url) {
        toast({
          title: "Erreur",
          description: "Impossible de générer le lien du calendrier",
          variant: "destructive"
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      toast({
        title: "Lien copié",
        description: "Le lien du calendrier a été copié dans le presse-papier"
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openCalendar = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session introuvable");

      // For direct access, we need to use the supabase functions client
      const { data, error } = await supabase.functions.invoke('calendar-sync', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error("Erreur lors de la récupération du calendrier:", error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer le calendrier",
          variant: "destructive"
        });
        return;
      }

      // Create a blob from the response and download it
      const blob = new Blob([data], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'evenements-getigne-collectif.ics';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erreur lors du téléchargement du calendrier:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le calendrier",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Synchroniser</span>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Synchroniser vos événements avec votre calendrier</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-1">Synchronisation de calendrier</h3>
            <p className="text-sm text-getigne-700">
              Ajoutez vos événements à votre calendrier personnel pour ne rien manquer.
            </p>
          </div>
          
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start" 
              onClick={copyToClipboard}
              disabled={isLoading}
            >
              <Copy size={16} className="mr-2" />
              Copier le lien
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start" 
              onClick={openCalendar}
              disabled={isLoading}
            >
              <ExternalLink size={16} className="mr-2" />
              Télécharger le calendrier (.ics)
            </Button>
          </div>
          
          <div className="text-xs text-getigne-700">
            <p className="font-medium mb-1">Comment utiliser ce lien :</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Google Calendar : Paramètres → Ajouter un calendrier → Depuis une URL</li>
              <li>Apple Calendar : Fichier → Nouvel abonnement à un calendrier</li>
              <li>Outlook : Fichier → Informations → Comptes → Abonnements calendrier</li>
            </ul>
            <p className="mt-2">
              Note : Pour Google Agenda, si le lien ne fonctionne pas, vous devrez peut-être télécharger le fichier .ics et l'importer manuellement.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CalendarSync;

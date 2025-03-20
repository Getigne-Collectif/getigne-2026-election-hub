
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

  if (!user) return null;

  const getCalendarUrl = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session introuvable");

      // Get production or development URL from window.location
      const baseUrl = window.location.origin.includes('localhost')
        ? "http://localhost:54321/functions/v1/calendar-sync"
        : "https://jqpivqdwblrccjzicnxn.supabase.co/functions/v1/calendar-sync";
      
      return `${baseUrl}?token=${session.access_token}`;
    } catch (error) {
      console.error("Erreur lors de la génération de l'URL du calendrier:", error);
      return null;
    }
  };

  const copyToClipboard = async () => {
    const url = await getCalendarUrl();
    if (!url) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le lien du calendrier",
        variant: "destructive"
      });
      return;
    }

    try {
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
    }
  };

  const openCalendar = async () => {
    const url = await getCalendarUrl();
    if (!url) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le lien du calendrier",
        variant: "destructive"
      });
      return;
    }
    window.open(url, '_blank');
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
            >
              <Copy size={16} className="mr-2" />
              Copier le lien
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start" 
              onClick={openCalendar}
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
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CalendarSync;

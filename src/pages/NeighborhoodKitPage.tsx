import React from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';
import FacebookIcon from '@/components/icons/facebook.svg?react';
import InstagramIcon from '@/components/icons/instagram.svg?react';
import TelegramIcon from '@/components/icons/telegram.svg?react';
import { 
  Home, 
  Calendar, 
  Coffee, 
  Package, 
  CheckCircle, 
  Clock, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Heart,
  ChevronRight,
  Download,
  Printer,
  Share2,
  Lightbulb,
  MessageCircle,
  UserCheck,
  Star,
  Copy,
  ExternalLink
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DiscordLogoIcon } from '@radix-ui/react-icons';

const NeighborhoodKitPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [event, setEvent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [checklistProgress, setChecklistProgress] = React.useState({});
  const [showFlyerContent, setShowFlyerContent] = React.useState(false);
  const { toast } = useToast();


    const DISCORD_URL = import.meta.env.VITE_DISCORD_INVITE_URL as string;

  React.useEffect(() => {
    window.scrollTo(0, 0);
    
    const eventId = searchParams.get('id');
    
    if (!eventId) {
      navigate('/cafes-de-quartier');
      return;
    }
    
    loadEvent(eventId);
  }, [searchParams, navigate]);

  const loadEvent = async (eventId) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('event_type', 'neighborhood')
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('Événement non trouvé');
      }
      
      setEvent(data);
      const progress = (data as any).checklist_progress || {};
      // Marquer automatiquement la première étape comme terminée si elle ne l'est pas déjà
      if (data.date && data.location && !progress.date_location) {
        progress.date_location = true;
        // Mettre à jour la base de données
        await supabase
          .from('events')
          .update({ checklist_progress: progress } as any)
          .eq('id', data.id);
      }
      setChecklistProgress(progress);
    } catch (err) {
      console.error('Erreur lors du chargement de l\'événement:', err);
      setError(err.message);
      navigate('/cafes-de-quartier');
    } finally {
      setLoading(false);
    }
  };

  const updateChecklistProgress = async (stepId: string, completed: boolean) => {
    if (!event) return;
    
    try {
      const newProgress = { ...checklistProgress, [stepId]: completed };
      setChecklistProgress(newProgress);
      
      const { error } = await supabase
        .from('events')
        .update({ checklist_progress: newProgress } as any)
        .eq('id', event.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: completed ? "Étape terminée !" : "Étape réinitialisée",
        description: `L'étape "${stepId}" a été ${completed ? 'marquée comme terminée' : 'réinitialisée'}`,
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le progrès",
        variant: "destructive"
      });
      // Revert the change
      setChecklistProgress(checklistProgress);
    }
  };

  const copyToClipboard = async (text: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copié !",
        description: `Message ${platform} copié dans le presse-papier`,
      });
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
      toast({
        title: "Erreur",
        description: "Impossible de copier le texte",
        variant: "destructive"
      });
    }
  };

  const extractNeighborhoodName = (title: string): string => {
    // Extrait le nom du quartier depuis "Café de quartier \"La roche\""
    const match = title.match(/Café de quartier \\?"(.+?)\\?"/);
    return match ? match[1] : title.replace('Café de quartier', '').replace(/['"]/g, '').trim();
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/flyer-template.png';
    link.download = 'modele-flyer-cafe-quartier.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateFlyer = async () => {
    if (!event) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Impossible d\'initialiser le canvas');
      }

      // Charger le template d'abord pour obtenir ses dimensions originales
      const template = new Image();
      template.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        template.onload = resolve;
        template.onerror = reject;
        template.src = '/templates/flyer-template.png';
      });

      // Utiliser les dimensions originales du template pour garder la qualité
      canvas.width = template.width;
      canvas.height = template.height;

      // Dessiner le template à sa taille originale
      ctx.drawImage(template, 0, 0);

      // Extraire le nom du quartier
      const neighborhoodName = extractNeighborhoodName(event.title);
      
      // Formatage de la date et heure
      const eventDate = new Date(event.date);
      const dateStr = eventDate.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
      const timeStr = eventDate.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // Générer l'URL de l'événement
      const eventSlug = neighborhoodName.toLowerCase().replace(/\s+/g, '-').replace(/['"]/g, '');
      const eventUrl = `https://getigne-collectif.fr/agenda/cafe-de-quartier-${eventSlug}`;

      // Configuration du texte
      ctx.textAlign = 'center';
      
      // Calculer les facteurs d'échelle basés sur les dimensions du canvas
      const scaleFactor = Math.min(canvas.width / 496, canvas.height / 701); // Facteur par rapport aux dimensions A5 de référence
      
      // Nom du quartier (remonté, en gras)
      ctx.fillStyle = '#1f2937'; // Gris foncé
      ctx.font = `bold ${Math.round(32 * scaleFactor)}px Arial, sans-serif`;
      ctx.fillText(neighborhoodName, canvas.width / 2, Math.round(220 * scaleFactor));

      // Adresse (remontée, sous le nom, plus petit et fin)
      ctx.font = `normal ${Math.round(16 * scaleFactor)}px Arial, sans-serif`;
      ctx.fillStyle = '#4b5563'; // Gris moyen
      
      // Diviser l'adresse en 2 lignes si nécessaire
      const address = event.location || '[Adresse]';
      const addressLines = address.length > 30 ? 
        [address.substring(0, address.lastIndexOf(' ', 30)), address.substring(address.lastIndexOf(' ', 30) + 1)] :
        [address];
      
      addressLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, Math.round((250 + (index * 18)) * scaleFactor));
      });

      // Date et heure (légèrement redescendues pour un meilleur centrage)
      ctx.fillStyle = '#ffffff'; // Blanc pour le bouton
      ctx.font = `bold ${Math.round(16 * scaleFactor)}px Arial, sans-serif`;
      
      // Combiner date et heure sur une ligne si possible
      const dateTimeStr = `${dateStr} à ${timeStr}`;
      ctx.fillText(dateTimeStr, canvas.width / 2, Math.round(315 * scaleFactor)); // 306 + 9px pour redescendre légèrement

      // Texte informatif sur les options de contact
      ctx.fillStyle = '#374151'; // Gris foncé
      ctx.font = `normal ${Math.round(12 * scaleFactor)}px Arial, sans-serif`;
      
      // Diviser le texte en deux lignes
      const contactText1 = `En nous envoyant un message directement (${event.organizer_contact || '[Contact]'})`;
      const contactText2 = `ou en scannant le QR code ci-contre`;
      
      ctx.fillText(contactText1, canvas.width / 2, Math.round(480 * scaleFactor));
      ctx.fillText(contactText2, canvas.width / 2, Math.round(495 * scaleFactor)); // 15px sous la première ligne

      // Générer et dessiner le QR code
      try {
        const qrCodeDataURL = await QRCode.toDataURL(eventUrl, {
          width: Math.round(80 * scaleFactor),
          margin: 1,
          color: {
            dark: '#1f2937', // Gris foncé
            light: '#ffffff'  // Blanc
          }
        });
        
        const qrCodeImage = new Image();
        await new Promise((resolve, reject) => {
          qrCodeImage.onload = resolve;
          qrCodeImage.onerror = reject;
          qrCodeImage.src = qrCodeDataURL;
        });
        
        // Dessiner le QR code (légèrement descendu)
        const qrSize = Math.round(80 * scaleFactor);
        const qrX = canvas.width / 2 + Math.round(150 * scaleFactor);
        const qrY = Math.round(485 * scaleFactor); // 470 + 15px pour descendre un peu
        
        ctx.drawImage(qrCodeImage, qrX, qrY, qrSize, qrSize);
      } catch (qrError) {
        console.warn('Impossible de générer le QR code:', qrError);
        // Continuer sans QR code si erreur
      }

      // Signature de l'organisateur (en police cursive)
      ctx.fillStyle = '#374151'; // Gris foncé pour la signature
      ctx.font = `italic ${Math.round(16 * scaleFactor)}px "Brush Script MT", "Lucida Handwriting", cursive`;
      ctx.textAlign = 'center';
      const signature = `— ${event.organizer_name || 'L\'organisateur'}`;
      ctx.fillText(signature, canvas.width / 2, Math.round(520 * scaleFactor)); // 25px sous le texte de contact

      // Convertir en image et télécharger
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `flyer-cafe-quartier-${neighborhoodName.toLowerCase().replace(/\s+/g, '-')}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Flyer généré !",
            description: "Votre flyer a été téléchargé avec succès",
          });
        }
      }, 'image/png', 1.0); // Qualité maximale
      
    } catch (err) {
      console.error('Erreur lors de la génération du flyer:', err);
      toast({
        title: "Erreur",
        description: "Impossible de générer le flyer",
        variant: "destructive"
      });
    }
  };

  const checklistItems = [
    {
      id: 1,
      stepId: 'date_location',
      title: `Date et lieu défini : ${event?.date ? new Date(event.date).toLocaleDateString('fr-FR') : '[Date]'} - ${event?.location || '[Lieu]'}`,
      description: "Privilégiez un endroit accessible et convivial, à l'intérieur en hiver et sinon, idéalement à l'abris en cas d'intempéries",
      icon: Calendar,
      color: "bg-blue-500",
      autoCompleted: true
    },
    {
      id: 2,
      stepId: 'digital_communication',
      title: "Si pertinent, communiquez avec les outils numériques.",
      description: "Si vous avez un groupe WhatsApp, Facebook, ou que vous avez l'habitude d'échanger par mail ou autre au sein de votre quartier, profitez-en pour partager l'invitation le plus rapidement possible. Rapide et efficace.",
      icon: Share2,
      color: "bg-cyan-500"
    },
    {
      id: 3,
      stepId: 'flyers_prepare',
      title: "Téléchargez et imprimez le flyer.",
      description: "Le flyer est déjà personnalisé avec vos informations - il suffit de l'imprimer ! Nous recommandons de le faire au moins 7-10 jours avant l'événement.",
      icon: FileText,
      color: "bg-green-500"
    },
    {
      id: 4,
      stepId: 'flyers_distribute',
      title: "Distribuez les flyers.",
      description: "Idéalement en porte-à-porte, sinon dans les boîtes aux lettres. À faire au moins 5-7 jours avant l'événement.",
      icon: Mail,
      color: "bg-purple-500"
    },
    {
      id: 5,
      stepId: 'structure_preparation',
      title: "Prenez connaissance du déroulé que nous vous proposons ci dessous.",
      description: "Accueil, jeu brise-glace, présentation du collectif, temps d'échange et projection.",
      icon: Users,
      color: "bg-pink-500"
    },
    {
      id: 6,
      stepId: 'food_drinks',
      title: "Préparez un petit pot convivial.",
      description: "Proposez une boisson chaude et/ou fraiche et/ou un petit grignotage pour accueillir les gens : un petit geste pour rendre la rencontre encore plus conviviale ! N'hésitez pas à faire appel aux membre de Gétigné Collectif pour vous assister sur ce point.",
      icon: Coffee,
      color: "bg-amber-500"
    }
  ];

  const eveningStructure = [
    {
      phase: "Accueil",
      duration: "15-20 min",
      description: "Reçois les participant·e·s avec un sourire et un petit mot. Propose-leur de se servir à boire et à manger.",
      icon: Heart,
      color: "bg-red-100 text-red-700"
    },
    {
      phase: "Jeu brise-glace",
      duration: "10 min",
      description: "\"Le mot du jour\" : Chaque personne dit son prénom et un mot qui lui fait penser à son quartier. Pas de pression, juste pour détendre l'atmosphère !",
      icon: Lightbulb,
      color: "bg-yellow-100 text-yellow-700"
    },
    {
      phase: "Présentation de Gétigné Collectif",
      duration: "10-15 min",
      description: "Un·e membre de Gétigné Collectif présentera nos actions et répondra aux questions.",
      icon: Users,
      color: "bg-blue-100 text-blue-700"
    },
    {
      phase: "Temps d'échange",
      duration: "30-45 min",
      description: "Discutez des thématiques du quartier, des projets en cours, des idées pour l'avenir.",
      icon: MessageCircle,
      color: "bg-green-100 text-green-700"
    },
    {
      phase: "Clôture et projection",
      duration: "10 min",
      description: "Résumez les idées et propositions, parlez des prochaines dates déjà annoncées dans la rubrique agenda. C'est également le moment de faire des appels aux dons, adhésions ou de tendre la main aux personnes désireuses de s'impliquer dans la vie du collectif.",
      icon: Star,
      color: "bg-purple-100 text-purple-700"
    }
  ];

  // État de chargement
  if (loading) {
    return (
      <HelmetProvider>
        <Helmet>
          <title>Chargement... | Gétigné Collectif</title>
        </Helmet>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-getigne-700">Chargement de l'événement...</p>
            </div>
          </div>
          <Footer />
        </div>
      </HelmetProvider>
    );
  }

  // Erreur ou événement non trouvé
  if (error || !event) {
    return (
      <HelmetProvider>
        <Helmet>
          <title>Erreur | Gétigné Collectif</title>
        </Helmet>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 mb-4">Événement non trouvé</p>
              <Link to="/cafes-de-quartier" className="text-primary hover:underline">
                Retour aux cafés de quartier
              </Link>
            </div>
          </div>
          <Footer />
        </div>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Kit d'organisation - Cafés de quartier | Gétigné Collectif</title>
        <meta
          name="description"
          content="Kit complet pour organiser un Café de quartier dans votre voisinage. Guide pas à pas, modèles de flyers et conseils pratiques."
        />
      </Helmet>
      
      <div className="min-h-screen bg-white">
        <Navbar />
        
        <main className="pt-20">
          {/* En-tête avec breadcrumb et hero coloré */}
          <section className="relative bg-gradient-to-br from-cyan-50 via-blue-50 to-getigne-50 py-8 overflow-hidden">
            {/* Éléments décoratifs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-200/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-200/20 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="container mx-auto px-4 relative">
              <Breadcrumb className="mb-6">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/" className="flex items-center">
                        <Home className="w-4 h-4 mr-1" />
                        Accueil
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/agenda" className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Agenda
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/cafes-de-quartier" className="flex items-center">
                        <Coffee className="w-4 h-4 mr-1" />
                        Cafés de quartier
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="flex items-center">
                      <Package className="w-4 h-4 mr-1" />
                      Kit d'organisation
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center bg-cyan-100 text-cyan-800 px-4 py-2 rounded-full text-sm font-medium">
                    <Package className="w-4 h-4 mr-2" />
                    Guide pratique
                  </div>
                  
                  <h1 className="text-5xl font-bold text-getigne-900 leading-tight">
                    Kit d'organisation de votre <br/>
                    <span className="text-amber-600"> Café de Quartier</span>
                  </h1>
                  
                  <div className="bg-gradient-to-r from-cyan-100 to-blue-100 rounded-xl p-6 border border-cyan-200">
                    <p className="text-lg text-getigne-700 leading-relaxed mb-4">
                      <span className="font-semibold text-cyan-800">Un grand merci à vous, {event.organizer_name || 'organisateur·rice'} !</span>
                    </p>
                    <p className="text-getigne-700 leading-relaxed">
                      Merci d'avoir accepté d'organiser un Café de Quartier dans votre quartier ou votre village. 
                      Grâce à des personnes comme vous, nous créons du lien, partageons des idées et renforçons 
                      la convivialité entre voisins.
                    </p>
                  </div>
                  
                  <p className="text-xl text-getigne-700 leading-relaxed">
                    Ce kit est là pour vous guider <span className="font-semibold text-emerald-700">pas à pas</span> et rendre 
                    l'organisation aussi simple et agréable que possible.
                  </p>
                  
                  {/* Bouton de téléchargement du flyer */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      onClick={generateFlyer}
                      size="lg"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Télécharger votre flyer personnalisé
                    </Button>
                    <div className="text-sm text-getigne-600 flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      Prêt à imprimer • Format A5 • QR code inclus
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <img 
                      src="/images/event.webp"
                      alt="Café de quartier convivial" 
                      className="w-full h-80 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4">
                        <p className="text-sm font-medium text-getigne-900">
                          ☕ Prêt à créer du lien dans votre quartier ?
                        </p>
                        <p className="text-xs text-getigne-600 mt-1">
                          Suivez le guide pour organiser votre rencontre
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Éléments décoratifs flottants */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-emerald-400 rounded-full opacity-80"></div>
                  <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-blue-300 rounded-full opacity-60"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Checklist pour organiser */}
          <section className="py-16 bg-gradient-to-b from-white to-emerald-50/30">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-getigne-900 mb-4">
                    Checklist pour organiser votre Café de Quartier
                  </h2>
                  <p className="text-lg text-getigne-700 max-w-3xl mx-auto">
                    Suivez ces étapes dans l'ordre pour préparer au mieux votre rencontre de voisinage.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {checklistItems.map((item, index) => {
                    const IconComponent = item.icon;
                    const isCompleted = checklistProgress[item.stepId] || (item.autoCompleted && event);
                    const isDisabled = item.autoCompleted && event;
                    
                    return (
                      <Card key={item.id} className={`hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm ${isCompleted ? 'ring-2 ring-green-200 bg-green-50/50' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 ${item.color} rounded-full flex items-center justify-center mr-3`}>
                                <IconComponent className="w-5 h-5 text-white" />
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Étape {index + 1}
                              </Badge>
                            </div>
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={(checked) => {
                                if (!isDisabled) {
                                  updateChecklistProgress(item.stepId, !!checked);
                                }
                              }}
                              disabled={isDisabled}
                              className="data-[state=checked]:bg-green-600"
                            />
                          </div>
                          <CardTitle className={`text-lg ${isCompleted ? 'line-through text-green-600' : ''}`}>
                            {item.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-getigne-700 leading-relaxed">
                            {item.description}
                          </CardDescription>
                          
                          {/* Bouton de téléchargement pour l'étape 3 (flyers) */}
                          {item.stepId === 'flyers_prepare' && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <Button
                                onClick={generateFlyer}
                                size="sm"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Télécharger le flyer
                              </Button>
                            </div>
                          )}
                          
                          {isCompleted && (
                            <div className="mt-3 flex items-center text-green-600 text-sm">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Terminé
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Structure type de l'événement */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-getigne-900 mb-4">
                    Déroulé de l'événement
                  </h2>
                  <p className="text-lg text-getigne-700 max-w-3xl mx-auto">
                    Une proposition de déroulé testée et approuvée pour un événement réussi.
                  </p>
                </div>

                <div className="space-y-4">
                  {eveningStructure.map((phase, index) => {
                    const IconComponent = phase.icon;
                    return (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mr-4">
                              <div className={`w-12 h-12 ${phase.color} rounded-full flex items-center justify-center`}>
                                <IconComponent className="w-6 h-6" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-semibold text-getigne-900">
                                  {phase.phase}
                                </h3>
                                <Badge variant="secondary" className="text-sm">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {phase.duration}
                                </Badge>
                              </div>
                              <p className="text-getigne-700 leading-relaxed">
                                {phase.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Conseils pour animer */}
          <section className="py-16 bg-gradient-to-b from-emerald-50/50 to-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-getigne-900 mb-4">
                    Conseils pour organiser votre Café de quartier
                  </h2>
                  <p className="text-lg text-getigne-700">
                    Quelques astuces pour que tout se passe bien.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-3 text-getigne-900">Rassurez-vous</h3>
                      <p className="text-getigne-700 text-sm leading-relaxed">
                        <strong>Vous n'êtes pas seul·e</strong>. Une personne de Gétigné Collectif sera présente pour vous accompagner. Votre rôle est avant tout d'accueillir les gens.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-3 text-getigne-900">Soyez à l'écoute</h3>
                      <p className="text-getigne-700 text-sm leading-relaxed">
                        Laissez la parole circuler et encouragez chacun·e à s'exprimer, à partager ses idées et ses besoins.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-3 text-getigne-900">Prévoyez un carnet</h3>
                      <p className="text-getigne-700 text-sm leading-relaxed">
                        Pour noter les idées, les questions et les contacts des personnes intéressées.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* Modèle de flyer */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-getigne-900 mb-4">
                    Supports de communication
                  </h2>
                  <p className="text-lg text-getigne-700 max-w-3xl mx-auto">
                    Téléchargez votre flyer prêt à imprimer avec toutes vos informations, plus des messages pour les réseaux sociaux.
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Modèle de flyer */}
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Download className="w-5 h-5 mr-2 text-emerald-600" />
                        Flyer personnalisé
                      </CardTitle>
                      <CardDescription>
                        Votre flyer est déjà prêt avec toutes vos informations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Bouton de téléchargement du flyer - EN PREMIER */}
                      <div className="text-center mb-6">
                        <img src="/images/flyer-mockup.png" alt="Mockup flyer" className="w-full h-auto mb-4" />
                        <Button
                          onClick={generateFlyer}
                          size="lg"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3"
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Télécharger le flyer
                        </Button>
                        <div className="mt-3 text-xs text-emerald-600 flex items-center justify-center">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                          Prêt à imprimer • Format A5 • QR code inclus
                        </div>
                      </div>
                      
                      {/* Liens pour le contenu et le modèle */}
                      <div className="text-center space-y-2">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => setShowFlyerContent(!showFlyerContent)}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            {showFlyerContent ? 'Masquer' : 'Voir'} le contenu brut du flyer
                          </button>
                          <span className="text-gray-400">•</span>
                          <button
                            onClick={downloadTemplate}
                            className="text-sm text-green-600 hover:text-green-800 underline"
                          >
                            Télécharger le modèle
                          </button>
                        </div>
                      </div>
                      
                      {/* Contenu du flyer - AFFICHÉ CONDITIONNELLEMENT */}
                      {showFlyerContent && (
                        <div className="mt-6 bg-gray-50 rounded-lg p-6 font-mono text-sm leading-relaxed">
                          <div className="space-y-4">
                            <div className="text-center">
                              <h3 className="text-xl font-bold text-getigne-900 mb-2">
                                Café de Quartier - {event.location || '[Nom du Quartier/Village]'}
                              </h3>
                            </div>
                            
                            <div className="space-y-2">
                              <p><strong>📅 Date</strong> : {event.date ? new Date(event.date).toLocaleDateString('fr-FR', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              }) : '[Date de l\'événement]'}</p>
                              <p><strong>⏰ Heure</strong> : {event.date ? new Date(event.date).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '[Heure de début]'}</p>
                              <p><strong>📍 Lieu</strong> : {event.location || '[Adresse ou lieu précis]'}</p>
                            </div>

                            <div className="text-center py-2">
                              <p className="font-semibold text-getigne-800">
                                Venez partager un moment convivial entre voisins !
                              </p>
                            </div>

                            <div>
                              <p className="font-semibold mb-2">Au programme :</p>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>Rencontres et échanges</li>
                                <li>Présentation des actions du collectif</li>
                                <li>Discussions autour des projets du quartier</li>
                                <li>Un petit jeu pour faire connaissance</li>
                              </ul>
                            </div>

                            <div className="text-center py-2">
                              <p className="font-semibold text-emerald-700">
                                🍪 Un petit truc à grignoter et à boire sera offert !
                              </p>
                            </div>

                            <div className="space-y-1">
                              <p><strong>📞 Contact</strong> : {event.organizer_name || '[Votre nom]'}</p>
                              <p><strong>📧 Réservation</strong> : {event.organizer_contact || '[Votre adresse email ou un lien pour s\'inscrire]'}</p>
                            </div>

                            <div className="text-center text-xs text-gray-600 pt-2 border-t">
                              <p>Gétigné Collectif.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Messages réseaux sociaux */}
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageCircle className="w-5 h-5 mr-2 text-emerald-600" />
                        Partagez sur les réseaux sociaux
                      </CardTitle>
                      <CardDescription>
                        Diffusez rapidement l'invitation sur vos canaux préférés
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Logos des réseaux sociaux */}
                        <div className="flex items-center justify-center space-x-6 py-4">
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                              <MessageCircle className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-sm font-medium text-green-700">WhatsApp</span>
                          </div>
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                              <FacebookIcon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-sm font-medium text-blue-700">Facebook</span>
                          </div>
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                              <InstagramIcon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-sm font-medium text-pink-700">Instagram</span>
                          </div>
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                              <TelegramIcon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-sm font-medium text-blue-700">Telegram</span>
                          </div>
                        </div>

                        {/* Message à copier */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Message à partager :</h4>
                            <Button
                              variant="outline"
                              size="sm"
                                onClick={() => copyToClipboard(
                                 `Bonjour chers voisins, chères voisines ! 👋

J'organise un Café de Quartier, une démarche impulsée par le collectif citoyen Gétigné Collectif

📅 ${event?.date ? new Date(event.date).toLocaleDateString('fr-FR') : '[Date]'}
📍 ${event?.location || '[Lieu]'}

C'est l'occasion de faire connaissance, d'échanger des idées et de renforcer les liens dans notre quartier. Le collectif porte un projet intéressant pour les élections municipales de mars 2026 et souhaite échanger avec nous, les habitants, sur nos attentes et idées pour la commune et notre quartier.

📞 Contact : ${event?.organizer_name || '[Organisateur]'} - ${event?.organizer_contact || '[Contact]'}

Au plaisir de vous y retrouver ! 😊

#CafeDeQuartier #GetigneCollectif`,
                                 'réseaux sociaux'
                                )}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copier
                            </Button>
                          </div>
                            <div className="bg-white rounded border p-3 text-sm leading-relaxed">
                              <p className="mb-2">Bonjour chers voisins, chères voisines ! 👋</p>
                              <p className="mb-2">J'organise un Café de Quartier, une démarche impulsée par le collectif citoyen Gétigné Collectif.</p>
                              <p className="mb-2">📅 {event?.date ? new Date(event.date).toLocaleDateString('fr-FR') : '[Date]'}</p>
                              <p className="mb-2">📍 {event?.location || '[Lieu]'}</p>
                              <p className="mb-2">C'est l'occasion de faire connaissance, d'échanger des idées et de renforcer les liens dans notre quartier. Le collectif porte un projet intéressant pour les élections municipales de mars 2026 et souhaite échanger avec nous, les habitants, sur nos attentes et idées pour la commune et notre quartier.</p>
                              <p className="mb-2">📞 Contact : {event?.organizer_name || '[Organisateur]'} - {event?.organizer_contact || '[Contact]'}</p>
                              <p className="mb-2">Au plaisir de vous y retrouver ! 😊</p>
                              <p className="text-gray-500">#CafeDeQuartier #GetigneCollectif</p>
                            </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* Rappel membre du collectif */}
          <section className="py-16 bg-gradient-to-b from-emerald-100/50 to-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-blue-50">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <UserCheck className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-getigne-900 mb-4">
                      Rappel : Une personne du collectif sera présente
                    </h2>
                    <p className="text-lg text-getigne-700 leading-relaxed mb-6">
                      Un·e membre du collectif viendra pour vous aider à animer votre événement, 
                      répondre aux questions et présenter nos actions. 
                      <span className="font-semibold text-emerald-800">Vous n'êtes pas seul·e !</span>
                    </p>
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                      <Link to="/contact">
                        <Phone className="w-4 h-4 mr-2" />
                        Nous contacter
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                <div className="relative mt-8 overflow-hidden bg-gradient-to-r from-primary to-purple-600 rounded-xl border border-primary/20 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-purple-600/90"></div>
                        <div className="relative p-4 text-white">
                            <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                                <DiscordLogoIcon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold mb-1">
                                Pour toute question, n'hésitez pas à nous contacter !
                                </h3>
                                <p className="text-white/90 text-xs mb-2">
                                Notre discord vous permet de nous contacter en direct.
                                </p>
                                <a
                                href={DISCORD_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white font-medium text-xs transition-all duration-200 hover:scale-105"
                                >
                                Rejoindre le serveur
                                </a>
                            </div>
                            </div>
                        </div>
                    </div>
              </div>
            </div>
          </section>

          {/* Après l'événement */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-getigne-900 mb-4">
                    Après l'événement
                  </h2>
                  <p className="text-lg text-getigne-700 max-w-3xl mx-auto">
                    Quelques étapes pour prolonger l'impact de votre rencontre
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-3 text-getigne-900">Faites un retour</h3>
                      <p className="text-getigne-700 text-sm leading-relaxed">
                        Notez les idées, les questions et les contacts recueillis.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-3 text-getigne-900">Partagez vos impressions</h3>
                      <p className="text-getigne-700 text-sm leading-relaxed">
                        Envoyez-nous un petit mail ou un message pour nous dire comment ça s'est passé.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-3 text-getigne-900">Prévoyez la suite</h3>
                      <p className="text-getigne-700 text-sm leading-relaxed">
                        Si l'envie est là, rejoignez-nous sur nos prochains événements !
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* Message de remerciement final */}
          <section className="py-16 bg-gradient-to-br from-cyan-100 via-blue-100 to-getigne-50">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-cyan-200">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-getigne-900 mb-4">
                    Merci encore pour votre engagement
                  </h2>
                  <p className="text-xl text-getigne-700 leading-relaxed mb-6">
                    et <span className="font-semibold text-cyan-800">bon Café de Quartier</span> !
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default NeighborhoodKitPage;

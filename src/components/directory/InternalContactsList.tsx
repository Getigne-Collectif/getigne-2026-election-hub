import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Download, 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  GraduationCap,
  Briefcase,
  Users,
  Award,
  Clock
} from 'lucide-react';
import type { TeamMember } from '@/types/electoral.types';
import { downloadVCard, downloadMultipleVCards } from '@/utils/vcard';
import { cn } from '@/lib/utils';
import { generateRoutes } from '@/routes';
import InternalContactDetailDialog from './InternalContactDetailDialog';

// Helpers pour gérer les cookies
const setCookie = (name: string, value: string, days: number = 30) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
};

const InternalContactsList = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Initialiser la recherche depuis les cookies
  const [searchQuery, setSearchQuery] = useState(() => getCookie('internalDirectory_search') || '');
  const [activeLetter, setActiveLetter] = useState('A');
  
  // État pour la dialog de détails
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  // Sauvegarder la recherche dans les cookies à chaque changement
  useEffect(() => {
    setCookie('internalDirectory_search', searchQuery);
  }, [searchQuery]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des membres:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les membres de l\'équipe.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    
    const query = searchQuery.toLowerCase();
    return members.filter((member) => {
      return (
        member.name.toLowerCase().includes(query) ||
        (member.email && member.email.toLowerCase().includes(query)) ||
        (member.phone && member.phone.toLowerCase().includes(query)) ||
        (member.profession && member.profession.toLowerCase().includes(query)) ||
        (member.role && member.role.toLowerCase().includes(query)) ||
        (member.address && member.address.toLowerCase().includes(query))
      );
    });
  }, [members, searchQuery]);

  // Grouper les membres par lettre initiale
  const groupedMembers = useMemo(() => {
    const groups: { [key: string]: TeamMember[] } = {};
    
    filteredMembers.forEach((member) => {
      const firstLetter = member.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(member);
    });
    
    return groups;
  }, [filteredMembers]);

  // Générer l'alphabet complet
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Scroll vers une lettre
  const scrollToLetter = (letter: string) => {
    const section = sectionRefs.current[letter];
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Détecter la lettre active au scroll
  useEffect(() => {
    if (!containerRef.current) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset pour le header

      // Trouver quelle section est visible
      for (const letter of Object.keys(groupedMembers).sort()) {
        const section = sectionRefs.current[letter];
        if (section) {
          const { offsetTop, offsetHeight } = section;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveLetter(letter);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [groupedMembers]);

  const handleDownloadAll = () => {
    if (filteredMembers.length === 0) {
      toast({
        title: 'Aucun contact',
        description: 'Il n\'y a aucun contact à exporter.',
        variant: 'destructive',
      });
      return;
    }

    downloadMultipleVCards(filteredMembers);
    toast({
      title: 'Export réussi',
      description: `${filteredMembers.length} contact(s) exporté(s) au format vCard`,
    });
  };

  const handleDownloadSingle = (member: TeamMember, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    downloadVCard(member);
    toast({
      title: 'vCard téléchargée',
      description: `Contact de ${member.name} exporté avec succès`,
    });
  };

  const handleMemberClick = (member: TeamMember) => {
    setSelectedMember(member);
    setDetailDialogOpen(true);
  };

  const handleEditMember = (memberId: string) => {
    navigate(generateRoutes.adminTeamMembersEdit(memberId));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const educationLabels: Record<string, string> = {
    'brevet': 'Brevet',
    'cap_bep': 'CAP/BEP',
    'bac_general': 'Bac Général',
    'bac_technologique': 'Bac Technologique',
    'bac_professionnel': 'Bac Professionnel',
    'bac_plus_1_2': 'Bac+1/2',
    'bac_plus_3': 'Bac+3',
    'bac_plus_4_5': 'Bac+4/5',
    'bac_plus_6_plus': 'Bac+6 et plus',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-getigne-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Barre d'actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, téléphone, profession..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1 sm:flex-initial">
            <Users className="h-4 w-4" />
            <span className="whitespace-nowrap">
              {filteredMembers.length} contact{filteredMembers.length > 1 ? 's' : ''}
            </span>
          </div>
          <Button 
            onClick={handleDownloadAll}
            disabled={filteredMembers.length === 0}
            size="sm"
            className="bg-getigne-accent hover:bg-getigne-accent/90"
          >
            <Download className="mr-2 h-3 w-3" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Liste des contacts avec index alphabétique */}
      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery
                ? 'Aucun contact ne correspond à votre recherche.'
                : 'Aucun contact dans l\'annuaire.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative flex gap-4">
          {/* Index alphabétique fixe */}
          <div className="hidden lg:block sticky top-24 h-fit">
            <div className="flex flex-col gap-0.5 bg-white border rounded-lg p-2 shadow-sm">
              {alphabet.map((letter) => {
                const hasMembers = groupedMembers[letter];
                const isActive = activeLetter === letter;
                
                return (
                  <button
                    key={letter}
                    onClick={() => hasMembers && scrollToLetter(letter)}
                    disabled={!hasMembers}
                    className={cn(
                      "text-xs font-medium w-6 h-6 rounded flex items-center justify-center transition-all",
                      hasMembers 
                        ? "hover:bg-getigne-100 cursor-pointer" 
                        : "text-muted-foreground/30 cursor-not-allowed",
                      isActive && hasMembers && "bg-getigne-accent text-white hover:bg-getigne-accent"
                    )}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 space-y-8">
            {Object.keys(groupedMembers).sort().map((letter) => (
              <div 
                key={letter} 
                ref={(el) => (sectionRefs.current[letter] = el)}
                className="scroll-mt-24"
              >
                {/* En-tête de section */}
                <div className="flex items-center gap-3 mb-3 sticky top-20 bg-gradient-to-r from-white via-white to-transparent z-10 py-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-getigne-accent text-white font-bold text-xl shadow-sm">
                    {letter}
                  </div>
                  <div className="h-px bg-gradient-to-r from-getigne-200 to-transparent flex-1" />
                </div>

                {/* Grille de contacts */}
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {groupedMembers[letter].map((member) => (
                    <Card 
                      key={member.id} 
                      className="overflow-hidden hover:shadow-md transition-all hover:border-getigne-300 cursor-pointer"
                      onClick={() => handleMemberClick(member)}
                    >
                      <CardContent className="p-0">
                        <div className="flex gap-3 p-3">
                          {/* Photo compacte */}
                          <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-getigne-100 to-getigne-50">
                            {member.image ? (
                              <img
                                src={member.image}
                                alt={member.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl font-bold text-getigne-400">
                                  {member.name.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Informations */}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Nom et badges */}
                            <div className="space-y-1">
                              <h3 className="font-semibold text-base text-getigne-900 truncate">
                                {member.name}
                              </h3>
                              <div className="flex flex-wrap gap-1.5">
                                {member.role && (
                                  <Badge variant="secondary" className="bg-getigne-100 text-getigne-700 text-xs px-2 py-0 h-5">
                                    {member.role}
                                  </Badge>
                                )}
                                {member.is_board_member && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                                    <Award className="h-2.5 w-2.5" />
                                  </Badge>
                                )}
                                {member.is_elected && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                                    <Users className="h-2.5 w-2.5" />
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Coordonnées compactes */}
                            <div className="space-y-1 text-xs">
                              {member.profession && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Briefcase className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{member.profession}</span>
                                </div>
                              )}

                              {member.email && (
                                <div className="flex items-center gap-1.5">
                                  <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <a 
                                    href={`mailto:${member.email}`}
                                    className="text-getigne-600 hover:text-getigne-800 hover:underline truncate"
                                    title={member.email}
                                  >
                                    {member.email}
                                  </a>
                                </div>
                              )}

                              {member.phone && (
                                <div className="flex items-center gap-1.5">
                                  <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <a 
                                    href={`tel:${member.phone}`}
                                    className="text-getigne-600 hover:text-getigne-800 hover:underline"
                                  >
                                    {member.phone}
                                  </a>
                                </div>
                              )}

                              {member.address && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate" title={member.address}>{member.address}</span>
                                </div>
                              )}

                              {/* Infos supplémentaires en ligne */}
                              <div className="flex flex-wrap gap-2 pt-1 text-muted-foreground">
                                {member.birth_date && (
                                  <div className="flex items-center gap-1" title={`Né(e) le ${formatDate(member.birth_date)}`}>
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(member.birth_date)}</span>
                                  </div>
                                )}
                                {member.education_level && (
                                  <div className="flex items-center gap-1" title="Niveau d'études">
                                    <GraduationCap className="h-3 w-3" />
                                    <span>{educationLabels[member.education_level] || member.education_level}</span>
                                  </div>
                                )}
                                {member.vignoble_arrival_year && (
                                  <div className="flex items-center gap-1" title="Arrivée dans le vignoble">
                                    <Clock className="h-3 w-3" />
                                    <span>{member.vignoble_arrival_year}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Bouton d'action */}
                          <div className="flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleDownloadSingle(member, e)}
                              title="Télécharger vCard"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog de détails du membre */}
      <InternalContactDetailDialog
        member={selectedMember}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEdit={handleEditMember}
      />
    </div>
  );
};

export default InternalContactsList;

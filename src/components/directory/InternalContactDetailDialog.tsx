import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit,
  Download,
  Briefcase,
  Calendar,
  Award,
  FileText
} from 'lucide-react';
import type { TeamMember } from '@/types/electoral.types';
import { downloadVCard } from '@/utils/vcard';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Type étendu pour inclure les positions électorales
type TeamMemberWithPosition = TeamMember & {
  electoral_position?: number | null;
  substitute_position?: number | null;
};

interface InternalContactDetailDialogProps {
  member: TeamMemberWithPosition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (memberId: string) => void;
}

const InternalContactDetailDialog = ({ 
  member, 
  open, 
  onOpenChange,
  onEdit 
}: InternalContactDetailDialogProps) => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  if (!member) return null;

  const handleDownload = () => {
    downloadVCard(member);
    toast({
      title: 'vCard téléchargée',
      description: `Contact de ${member.name} exporté avec succès`,
    });
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(member.id);
      onOpenChange(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return null;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getEngagementLevelLabel = (level: string | null) => {
    if (!level) return null;
    
    const labels: Record<string, string> = {
      'positions_1_8': 'Positions 1 à 8',
      'positions_9_21': 'Positions 9 à 21',
      'positions_22_29': 'Positions 22 à 29',
    };
    
    return labels[level] || level;
  };

  const getListPosition = () => {
    if (member.electoral_position !== null) {
      return member.electoral_position;
    }
    if (member.substitute_position !== null) {
      return member.substitute_position + 27;
    }
    return null;
  };

  const listPosition = getListPosition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Détails du membre</DialogTitle>
          <DialogDescription className="sr-only">
            Informations complètes sur {member.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* En-tête avec photo et nom */}
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 flex-shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-getigne-200 to-getigne-100 border-4 border-getigne-300">
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-getigne-700">
                    {getInitials(member.name)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-getigne-900">{member.name}</h2>
              {member.role && (
                <p className="text-lg text-getigne-600 font-medium mt-1 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  {member.role}
                </p>
              )}
              {member.profession && (
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Briefcase className="h-4 w-4" />
                  {member.profession}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <Button onClick={handleDownload} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger vCard
                </Button>
                {isAdmin && onEdit && (
                  <Button onClick={handleEdit} size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Coordonnées */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-getigne-600" />
              Coordonnées
            </h3>
            <div className="grid gap-3">
              {member.email && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a 
                      href={`mailto:${member.email}`}
                      className="text-sm font-medium hover:text-getigne-600 truncate block"
                    >
                      {member.email}
                    </a>
                  </div>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <a 
                      href={`tel:${member.phone}`}
                      className="text-sm font-medium hover:text-getigne-600"
                    >
                      {member.phone}
                    </a>
                  </div>
                </div>
              )}
              {member.address && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Adresse</p>
                    <p className="text-sm font-medium">{member.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date de naissance */}
          {member.birth_date && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-getigne-600" />
                  Date de naissance
                </h3>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{formatDate(member.birth_date)}</p>
                </div>
              </div>
            </>
          )}

          {/* Bio */}
          {member.bio && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-getigne-600" />
                  Biographie
                </h3>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{member.bio}</p>
                </div>
              </div>
            </>
          )}

          {/* Position électorale */}
          {(listPosition !== null || member.max_engagement_level) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-getigne-600" />
                  Position électorale
                </h3>
                <div className="space-y-2">
                  {listPosition !== null && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Position actuelle</p>
                      <p className="text-sm font-medium">
                        Sur la liste (position {listPosition})
                      </p>
                    </div>
                  )}
                  {member.max_engagement_level && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Niveau d'engagement max envisagé</p>
                      <Badge variant="outline" className="font-normal">
                        {getEngagementLevelLabel(member.max_engagement_level)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InternalContactDetailDialog;

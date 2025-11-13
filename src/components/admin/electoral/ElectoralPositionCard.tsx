import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Edit, User } from 'lucide-react';
import type {
  ElectoralPosition,
  ElectoralListMemberWithDetails,
} from '@/types/electoral.types';

interface ElectoralPositionCardProps {
  position: ElectoralPosition;
  onOpenRolesModal: (member: ElectoralListMemberWithDetails) => void;
  onRemove: (position: number) => void;
  isOver: boolean;
  draggedFrom: number | null;
  positions: ElectoralPosition[];
  overId: string | null;
  expectedGender: string | null;
}

const ElectoralPositionCard = ({
  position,
  onOpenRolesModal,
  onRemove,
  isOver,
  draggedFrom,
  positions,
  overId,
  expectedGender,
}: ElectoralPositionCardProps) => {
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `position-${position.position}`,
    data: {
      type: 'position',
      position: position.position,
    },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `assigned-${position.position}`,
    data: {
      type: 'assigned',
      position: position.position,
      memberId: position.member?.team_member_id,
    },
    disabled: !position.member,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // Déterminer quel membre afficher pendant le drag
  const isDraggedPosition = draggedFrom === position.position;
  
  // Extraire la position survolée depuis overId
  const overMatch = overId?.match(/position-(\d+)/);
  const overPosition = overMatch ? parseInt(overMatch[1], 10) : null;
  
  // Si c'est la position d'origine ET qu'on survole une autre position différente
  // On affiche en transparent le membre qui va prendre cette place
  let previewMember = null;
  let isPreviewMode = false;
  let showAsEmpty = false;
  
  if (isDraggedPosition && overPosition && overPosition !== draggedFrom) {
    // Trouver le membre à la position survolée
    previewMember = positions.find(p => p.position === overPosition)?.member || null;
    isPreviewMode = !!previewMember; // Preview mode seulement s'il y a un membre à échanger
    
    // Si on survole une position vide, afficher la carte source comme vide
    if (!previewMember) {
      showAsEmpty = true;
    }
  }

  if ((!position.member && !previewMember) || showAsEmpty) {
    // Carte vide - même hauteur que les cartes avec membre
    return (
      <div ref={setDroppableRef} className="h-full min-h-[480px]">
        <Card
          className={`h-full flex items-center justify-center transition-colors ${
            isOver ? 'border-getigne-accent border-2 bg-green-100' : 'border-dashed'
          }`}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="text-7xl font-bold text-gray-300 mb-4">
              {position.position}
            </div>
            <div className="text-lg text-gray-400">Position libre</div>
            {expectedGender && (
              <div className="mt-4 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                {expectedGender === 'femme' ? '♀ Femme' : '♂ Homme'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Carte avec membre (réel ou aperçu)
  const displayMember = previewMember || position.member!;
  const primaryRole = displayMember.roles.find((r) => r.is_primary);

  const calculateAge = (birthDate?: string | null): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(displayMember.team_member.birth_date);

  return (
    <div ref={setDroppableRef} className="h-full min-h-[480px]">
      <div
        ref={setDraggableRef}
        style={style}
        {...attributes}
        {...listeners}
        className={isDragging ? 'opacity-50 h-full' : 'h-full'}
      >
        <Card className={`h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow cursor-move ${
          isOver ? 'border-2 border-green-500 bg-green-50' : ''
        } ${isPreviewMode ? 'opacity-60 border-2 border-dashed border-blue-400' : ''}`}>
          <div className="relative">
            <div className="absolute top-2 left-2 z-10">
              <Badge className={`text-lg font-bold px-3 py-1 ${
                isPreviewMode ? 'bg-blue-500 text-white' : 'bg-getigne-accent text-white'
              }`}>
                {position.position}
              </Badge>
            </div>
            {isPreviewMode && (
              <div className="absolute top-2 left-20 z-10">
                <Badge variant="outline" className="bg-white/90 text-blue-600 border-blue-400 text-xs">
                  ⇄ Aperçu
                </Badge>
              </div>
            )}
            {!isPreviewMode && (
              <div className="absolute top-2 right-2 z-10 flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 w-7 p-0"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenRolesModal(position.member!);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 w-7 p-0"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(position.position);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div 
              className={`relative overflow-hidden h-80 bg-center ${
                displayMember.team_member.image ? 'bg-cover' : 'bg-contain bg-no-repeat'
              }`}
              style={{
                backgroundImage: displayMember.team_member.image 
                  ? `url(${displayMember.team_member.image})` 
                  : 'url(/images/user.png)',
                backgroundColor: '#e5f3f1'
              }}
            >
              
              {/* Overlay avec nom et profession */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4 pt-8">
                <h3 className="font-bold text-xl text-white mb-1 line-clamp-2">
                  {displayMember.team_member.name}
                </h3>
                <p className="text-sm text-white/90 mb-1">
                  <small className="text-sm text-white/90">{age !== null && `${age} ans `}</small>
                  {displayMember.team_member.profession && `- ${displayMember.team_member.profession}`}
                </p>
              </div>
            </div>
          </div>
          <CardContent className="p-5 flex-1">
            {displayMember.roles.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {displayMember.roles.map((role) => (
                  <Badge
                    key={role.id}
                    variant={role.is_primary ? 'default' : 'outline'}
                    className="text-xs"
                    style={{
                      backgroundColor: role.is_primary
                        ? role.thematic_role.color || undefined
                        : undefined,
                      borderColor: !role.is_primary
                        ? role.thematic_role.color || undefined
                        : undefined,
                      color: !role.is_primary
                        ? role.thematic_role.color || undefined
                        : undefined,
                    }}
                  >
                    {role.thematic_role.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ElectoralPositionCard;


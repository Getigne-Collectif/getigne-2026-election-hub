import { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { TeamMember } from '@/types/electoral.types';

interface UnassignedMembersListProps {
  members: TeamMember[];
}

const UnassignedMemberItem = ({ member }: { member: TeamMember }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `unassigned-${member.id}`,
      data: {
        type: 'unassigned',
        memberId: member.id,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-3 p-3 rounded-lg border bg-white hover:shadow-md transition-shadow cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
        {member.image ? (
          <img
            src={member.image}
            alt={member.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-getigne-100">
            <span className="text-lg text-getigne-400">
              {member.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm line-clamp-1">{member.name}</div>
        {member.profession && (
          <div className="text-xs text-gray-500 line-clamp-1">
            {member.profession}
          </div>
        )}
      </div>
    </div>
  );
};

const UnassignedMembersList = ({ members }: UnassignedMembersListProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { setNodeRef, isOver } = useDroppable({
    id: 'unassigned-zone',
    data: {
      type: 'unassigned',
    },
  });

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.profession &&
        member.profession.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg">
          Membres disponibles ({members.length})
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        className={`max-h-[calc(100vh-16rem)] overflow-y-auto space-y-2 ${
          isOver ? 'bg-red-50' : ''
        }`}
      >
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {searchQuery
              ? 'Aucun membre trouvé'
              : 'Tous les membres sont assignés'}
          </div>
        ) : (
          filteredMembers.map((member) => (
            <UnassignedMemberItem key={member.id} member={member} />
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default UnassignedMembersList;



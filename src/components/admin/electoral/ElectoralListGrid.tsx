import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ElectoralPositionCard from './ElectoralPositionCard';
import type {
  ElectoralPosition,
  ElectoralListMemberWithDetails,
} from '@/types/electoral.types';

interface ElectoralListGridProps {
  positions: ElectoralPosition[];
  onOpenRolesModal: (member: ElectoralListMemberWithDetails) => void;
  onRemoveMember: (position: number) => void;
  overId: string | null;
  draggedFrom: number | null;
  getExpectedGender: (position: number) => string | null;
}

const ElectoralListGrid = ({
  positions,
  onOpenRolesModal,
  onRemoveMember,
  overId,
  draggedFrom,
  getExpectedGender,
}: ElectoralListGridProps) => {
  const titularPositions = positions.filter((p) => p.position <= 27);
  const substitutePositions = positions.filter((p) => p.position > 27);

  return (
    <div className="space-y-8">
      {/* Titulaires */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Titulaires (1-27)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9 gap-4 auto-rows-fr">
              {titularPositions.map((position) => (
                <ElectoralPositionCard
                  key={position.position}
                  position={position}
                  onOpenRolesModal={onOpenRolesModal}
                  onRemove={onRemoveMember}
                  isOver={overId === `position-${position.position}`}
                  draggedFrom={draggedFrom}
                  positions={positions}
                  overId={overId}
                  expectedGender={getExpectedGender(position.position)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Remplaçants */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Remplaçants (28-29)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8 gap-4 auto-rows-fr">
              {substitutePositions.map((position) => (
                <ElectoralPositionCard
                  key={position.position}
                  position={position}
                  onOpenRolesModal={onOpenRolesModal}
                  onRemove={onRemoveMember}
                  isOver={overId === `position-${position.position}`}
                  draggedFrom={draggedFrom}
                  positions={positions}
                  overId={overId}
                  expectedGender={getExpectedGender(position.position)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ElectoralListGrid;


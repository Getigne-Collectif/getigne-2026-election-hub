import { useState, useEffect, useRef } from 'react';
import ElectoralMemberCard from './ElectoralMemberCard';
import type { ElectoralPosition } from '@/types/electoral.types';

interface ElectoralListDisplayProps {
  positions: ElectoralPosition[];
}

const ElectoralListDisplay = ({ positions }: ElectoralListDisplayProps) => {
  const titularPositions = positions.filter(
    (p) => p.position <= 27 && p.member !== null
  );
  const substitutePositions = positions.filter(
    (p) => p.position > 27 && p.member !== null
  );

  return (
    <section id="liste" className="py-16 px-4">
      <div className="container mx-auto">
        {/* Titulaires */}
        {titularPositions.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Liste des titulaires</h2>
              <p className="text-getigne-700">
                Les 27 candidat·es titulaires au conseil municipal
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {titularPositions.map((position) => (
                <ElectoralMemberCard
                  key={position.position}
                  position={position.position}
                  member={position.member!}
                />
              ))}
            </div>
          </div>
        )}

        {/* Remplaçants */}
        {substitutePositions.length > 0 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Remplaçant·es</h2>
              <p className="text-getigne-700">
                Les 2 candidat·es remplaçant·es
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
              {substitutePositions.map((position) => (
                <ElectoralMemberCard
                  key={position.position}
                  position={position.position}
                  member={position.member!}
                />
              ))}
            </div>
          </div>
        )}

        {titularPositions.length === 0 && substitutePositions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-getigne-700 text-lg">
              La liste sera bientôt disponible.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ElectoralListDisplay;






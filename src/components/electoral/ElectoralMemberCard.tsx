import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import type { ElectoralListMemberWithDetails } from '@/types/electoral.types';

interface ElectoralMemberCardProps {
  position: number;
  member: ElectoralListMemberWithDetails;
}

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

const ElectoralMemberCard = ({ position, member }: ElectoralMemberCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const primaryRole = member.roles.find((r) => r.is_primary);
  const secondaryRoles = member.roles.filter((r) => !r.is_primary);
  const age = calculateAge(member.team_member.birth_date);

  return (
    <div
      ref={ref}
      className={`bg-white rounded-xl overflow-hidden shadow-sm border border-getigne-100 hover-lift ${
        isVisible
          ? 'opacity-100 translate-y-0 transition-all duration-700 ease-out'
          : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${(position % 12) * 50}ms` }}
    >
      {/* Badge de position */}
      <div className="relative">
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-getigne-accent text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold">{position}</span>
          </div>
        </div>

        {/* Photo */}
        <div className="h-64 overflow-hidden">
          {member.team_member.image ? (
            <img
              src={member.team_member.image}
              alt={member.team_member.name}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-getigne-100">
              <span className="text-6xl text-getigne-400">
                {member.team_member.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        <h3 className="font-bold text-xl mb-1">{member.team_member.name}
        </h3>

        <p className="text-getigne-700 text-sm mb-2">
          <small className="text-sm text-getigne-500">{age !== null && `${age} ans, `}</small>
          {member.team_member.profession}
        </p>
        {/* Rôle principal */}
        {primaryRole && (
          <div className="mb-3">
            <Badge
              className="text-sm font-medium px-3 py-1"
              style={{
                backgroundColor: primaryRole.thematic_role.color || undefined,
              }}
            >
              {primaryRole.thematic_role.name}
            </Badge>
          </div>
        )}

        {/* Rôles secondaires */}
        {secondaryRoles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {secondaryRoles.map((role) => (
              <Badge
                key={role.id}
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: role.thematic_role.color || undefined,
                  color: role.thematic_role.color || undefined,
                }}
              >
                {role.thematic_role.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Bio */}
        <p className="text-getigne-700 text-sm line-clamp-3">
          {member.team_member.bio}
        </p>
      </div>
    </div>
  );
};

export default ElectoralMemberCard;


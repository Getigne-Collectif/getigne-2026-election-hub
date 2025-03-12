
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from 'lucide-react';

type CommitteeMember = {
  id: string;
  name: string;
  role: string;
  photo: string;
};

interface CommitteeMembersProps {
  committeeId: string;
  simplified?: boolean;
}

const CommitteeMembers = ({ committeeId, simplified = false }: CommitteeMembersProps) => {
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('committee_members')
          .select('*')
          .eq('committee_id', committeeId)
          .order('role', { ascending: false });
        
        if (error) throw error;
        
        setMembers(data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des membres:', error);
        setError('Impossible de charger les membres de la commission');
        setLoading(false);
      }
    };

    fetchMembers();
  }, [committeeId]);

  if (loading) {
    return <div className="py-2">Chargement des membres...</div>;
  }

  if (error) {
    return <div className="py-2 text-red-500">{error}</div>;
  }

  if (simplified) {
    // Version simplifiée pour le résumé
    const pilots = members.filter(member => member.role === 'pilote');
    const memberCount = members.length - pilots.length;
    
    return (
      <div className="flex flex-col space-y-2">
        {pilots.length > 0 && (
          <div>
            <div className="text-sm text-getigne-500 mb-1">
              {pilots.length > 1 ? 'Pilotes' : 'Pilote'}:
            </div>
            <div className="flex flex-wrap gap-2">
              {pilots.map(pilot => (
                <div key={pilot.id} className="flex items-center">
                  <Avatar className="w-6 h-6 mr-2">
                    {pilot.photo ? (
                      <AvatarImage src={pilot.photo} alt={pilot.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-getigne-100">
                        <User className="text-getigne-500 w-4 h-4" />
                      </div>
                    )}
                  </Avatar>
                  <span className="text-sm font-medium">{pilot.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-sm text-getigne-500">
          {memberCount} {memberCount > 1 ? 'membres' : 'membre'} au total
        </div>
      </div>
    );
  }

  // Version complète - affichée uniquement lorsque nécessaire
  const pilots = members.filter(member => member.role === 'pilote');
  const regularMembers = members.filter(member => member.role !== 'pilote');

  return (
    <div className="space-y-8">
      {/* Section des pilotes */}
      {pilots.length > 0 && (
        <div>
          <h3 className="text-xl font-medium mb-4">
            {pilots.length > 1 ? 'Pilotes de la commission' : 'Pilote de la commission'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {pilots.map(pilot => (
              <div key={pilot.id} className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 mb-3 border-2 border-getigne-accent">
                  {pilot.photo ? (
                    <AvatarImage src={pilot.photo} alt={pilot.name} className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-getigne-100">
                      <User className="text-getigne-500" />
                    </div>
                  )}
                </Avatar>
                <div className="space-y-1">
                  <h4 className="font-medium">{pilot.name}</h4>
                  <Badge className="bg-getigne-accent">Pilote</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section des membres */}
      {regularMembers.length > 0 && (
        <div>
          <h3 className="text-xl font-medium mb-4">
            {regularMembers.length > 1 ? 'Membres de la commission' : 'Membre de la commission'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {regularMembers.map(member => (
              <div key={member.id} className="flex flex-col items-center text-center">
                <Avatar className="w-20 h-20 mb-3 border border-getigne-200">
                  {member.photo ? (
                    <AvatarImage src={member.photo} alt={member.name} className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-getigne-100">
                      <User className="text-getigne-500" />
                    </div>
                  )}
                </Avatar>
                <div className="space-y-1">
                  <h4 className="font-medium">{member.name}</h4>
                  <Badge variant="outline" className="bg-white">Membre</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {members.length === 0 && (
        <div className="py-4 text-getigne-700">
          Aucun membre n'est encore associé à cette commission.
        </div>
      )}
    </div>
  );
};

export const getMemberCount = async (committeeId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('committee_members')
      .select('*', { count: 'exact', head: true })
      .eq('committee_id', committeeId);
    
    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error('Erreur lors du comptage des membres:', error);
    return 0;
  }
};

export default CommitteeMembers;

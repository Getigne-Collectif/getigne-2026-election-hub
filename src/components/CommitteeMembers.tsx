
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/components/ui/avatar";
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
}

const CommitteeMembers = ({ committeeId }: CommitteeMembersProps) => {
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
    return <div className="py-4">Chargement des membres...</div>;
  }

  if (error) {
    return <div className="py-4 text-red-500">{error}</div>;
  }

  // Séparer les pilotes des autres membres
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
                  <img src={pilot.photo} alt={pilot.name} className="object-cover" />
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

      {/* Section des membres réguliers */}
      {regularMembers.length > 0 && (
        <div>
          <h3 className="text-xl font-medium mb-4">Membres de la commission</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {regularMembers.map(member => (
              <div key={member.id} className="flex flex-col items-center text-center">
                <Avatar className="w-20 h-20 mb-2">
                  <img src={member.photo} alt={member.name} className="object-cover" />
                </Avatar>
                <div>
                  <h4 className="font-medium">{member.name}</h4>
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

import { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ElectoralListDisplay from '@/components/electoral/ElectoralListDisplay';
import GovernanceSection from '@/components/electoral/GovernanceSection';
import { Loader2 } from 'lucide-react';
import type {
  ElectoralList,
  ElectoralPosition,
  ElectoralListMemberWithDetails,
} from '@/types/electoral.types';
import type { OutputData } from '@editorjs/editorjs';

const TeamPage = () => {
  const [loading, setLoading] = useState(true);
  const [electoralList, setElectoralList] = useState<ElectoralList | null>(null);
  const [positions, setPositions] = useState<ElectoralPosition[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadElectoralList();
  }, []);

  const loadElectoralList = async () => {
    setLoading(true);
    try {
      // Charger la liste électorale active
      const { data: listData, error: listError } = await supabase
        .from('electoral_list')
        .select('*')
        .eq('is_active', true)
        .single();

      if (listError && listError.code !== 'PGRST116') throw listError;

      if (listData) {
        setElectoralList(listData);

        // Charger les membres de la liste avec leurs détails
        const { data: membersData, error: membersError } = await supabase
          .from('electoral_list_members')
          .select(
            `
            *,
            team_member:team_members(*),
            roles:electoral_member_roles(
              id,
              is_primary,
              thematic_role:thematic_roles(*)
            )
          `
          )
          .eq('electoral_list_id', listData.id)
          .order('position');

        if (membersError) throw membersError;

        // Créer les positions avec les membres
        const positionsArray: ElectoralPosition[] = Array.from(
          { length: 29 },
          (_, i) => {
            const position = i + 1;
            const member = membersData?.find((m) => m.position === position);
            return {
              position,
              member: member
                ? {
                    ...member,
                    team_member: member.team_member,
                    roles: member.roles.map((r: any) => ({
                      id: r.id,
                      is_primary: r.is_primary,
                      thematic_role: r.thematic_role,
                    })),
                  }
                : null,
            };
          }
        );

        setPositions(positionsArray);
      } else {
        // Pas de liste active
        setElectoralList(null);
        setPositions([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la liste:', error);
      setError('Impossible de charger la liste électorale.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>Liste électorale | Gétigné Collectif</title>
        <meta
          name="description"
          content="Découvrez la liste Gétigné Collectif pour les élections municipales de Mars 2026. Une liste citoyenne et participative pour une commune plus écologique, solidaire et démocratique."
        />
      </Helmet>

      <div className="page-content">
        <Navbar />
        
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 bg-gradient-to-br from-getigne-50 to-white">
          <div className="container mx-auto text-center">
            <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
              Élections municipales Mars 2026
            </span>
            <h1 className="text-5xl font-bold mt-4 mb-6">
              {electoralList?.title || 'Liste Gétigné Collectif'}
            </h1>
            {electoralList?.description && (
              <p className="text-xl text-getigne-700 max-w-3xl mx-auto">
                {electoralList.description}
              </p>
            )}
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-12 w-12 animate-spin text-getigne-accent" />
          </div>
        ) : error ? (
          <div className="py-24 px-4">
            <div className="container mx-auto text-center">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Liste électorale */}
            <ElectoralListDisplay positions={positions} />

            {/* Section Gouvernance */}
            {electoralList?.governance_content && (
              <GovernanceSection
                content={electoralList.governance_content as OutputData}
              />
            )}
          </>
        )}

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default TeamPage;

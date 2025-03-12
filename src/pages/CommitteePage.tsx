
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CommitteeMembers from '@/components/CommitteeMembers';
import CommitteeWorkModal from '@/components/CommitteeWorkModal';
import { type Tables } from '@/integrations/supabase/types';

interface Member {
  id: string;
  name: string;
  role: string;
  photo: string;
}

interface Committee {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const CommitteePage = () => {
  const { id } = useParams();
  const [selectedWork, setSelectedWork] = useState<Tables<'committee_works'> | null>(null);

  const membersQuery = useQuery({
    queryKey: ['committee', id, 'members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_members')
        .select('*')
        .eq('committee_id', id);

      if (error) {
        throw new Error(error.message);
      }

      return data as Member[];
    },
  });

  const worksQuery = useQuery({
    queryKey: ['committee', id, 'works'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_works')
        .select('*')
        .eq('committee_id', id)
        .order('date', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as Tables<'committee_works'>[];
    },
  });

  const committeeQuery = useQuery({
    queryKey: ['committee', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citizen_committees')
        .select('*')
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return data as Committee[];
    },
  });

  const works = worksQuery.data || [];
  const committee = committeeQuery.data?.[0];

  if (!committee) {
    return <div>Commission non trouvée</div>;
  }

  return (
    <div className="container py-8 space-y-8">
      <div>
        <div className="flex items-center gap-4">
          <img src={committee.icon} alt={committee.title} className="w-12 h-12" />
          <h1 className="text-3xl font-bold">{committee.title}</h1>
        </div>
        <p className="mt-2 text-muted-foreground">{committee.description}</p>
      </div>

      {id && <CommitteeMembers committeeId={id} />}

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Travaux de la commission</h2>
        <div className="grid gap-6">
          {works.map((work) => (
            <div
              key={work.id}
              className="p-6 bg-card rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedWork(work)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{work.title}</h3>
                <span className="text-sm text-muted-foreground">
                  {new Date(work.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <p className="mt-2 text-muted-foreground line-clamp-2">
                {work.content}
              </p>
              
              {/* Preview of attachments */}
              <div className="mt-4 flex gap-4">
                {(work.images as any[])?.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {(work.images as any[]).length} image(s)
                  </span>
                )}
                {(work.files as any[])?.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {(work.files as any[]).length} document(s)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CommitteeWorkModal
        work={selectedWork}
        open={!!selectedWork}
        onOpenChange={(open) => !open && setSelectedWork(null)}
      />
    </div>
  );
};

export default CommitteePage;

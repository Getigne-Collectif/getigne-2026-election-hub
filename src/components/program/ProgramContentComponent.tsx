
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import ProgramLikeButton from './ProgramLikeButton';
import ProgramPointCard from './ProgramPointCard';

interface ProgramContentComponentProps {
  programItemId: string;
  value: string;
}

export default function ProgramContentComponent({ programItemId, value }: ProgramContentComponentProps) {
  const [programPoints, setProgramPoints] = useState<any[]>([]);

  // Fetch program item details
  const { data: programItem, isLoading: isLoadingItem } = useQuery({
    queryKey: ['programItemDetail', programItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_items')
        .select('*')
        .eq('id', programItemId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!programItemId,
  });

  // Fetch program points
  const { isLoading: isLoadingPoints } = useQuery({
    queryKey: ['programPoints', programItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_points')
        .select('*')
        .eq('program_item_id', programItemId)
        .order('position', { ascending: true });
        
      if (error) throw error;
      setProgramPoints(data || []);
      return data;
    },
    enabled: !!programItemId,
  });

  if (isLoadingItem || isLoadingPoints) {
    return (
      <TabsContent value={value} className="min-h-[300px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-getigne-500" />
      </TabsContent>
    );
  }

  if (!programItem) {
    return (
      <TabsContent value={value} className="min-h-[300px] flex items-center justify-center">
        <p>Contenu non disponible</p>
      </TabsContent>
    );
  }

  return (
    <TabsContent value={value} className="space-y-6">
      <div>
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-3xl font-bold text-getigne-800">{programItem.title}</h2>
          <ProgramLikeButton programItemId={programItemId} />
        </div>
      
        {/* Description */}
        <div className="prose max-w-none mb-8 rich-content" dangerouslySetInnerHTML={{ __html: programItem.description }} />
        
        <Separator className="my-8" />
        
        {/* Program Points */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-getigne-700">Nos propositions</h3>
          
          {programPoints.length === 0 ? (
            <p className="text-getigne-500 italic">
              Les propositions de cette section sont en cours d'élaboration.
            </p>
          ) : (
            <div className="space-y-4">
              {programPoints.map((point) => (
                <ProgramPointCard 
                  key={point.id} 
                  point={point} 
                  programItemId={programItemId} 
                  icon={programItem.icon}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  );
}


import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AdminLayout from '@/components/admin/AdminLayout';
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import CommitteeWorkModal from '@/components/CommitteeWorkModal';

type CommitteeData = {
  id: string;
  title: string;
  description: string;
}

export default function AdminCommitteeWorksPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [committee, setCommittee] = useState<CommitteeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch committee data
  useEffect(() => {
    const fetchCommittee = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('citizen_committees')
          .select('id, title, description')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setCommittee(data);
      } catch (error) {
        console.error('Erreur lors du chargement de la commission:', error);
        toast.error("Impossible de charger les données de la commission");
        navigate('/admin/committees');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCommittee();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <AdminLayout
        title="Chargement..."
        description="Merci de patienter"
      >
        <div className="flex justify-center items-center h-32">
          <div className="loading">Chargement...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!committee) {
    return (
      <AdminLayout
        title="Commission non trouvée"
        description="La commission que vous recherchez n'existe pas"
      >
        <div className="flex justify-center mt-8">
          <Button onClick={() => navigate('/admin/committees')}>
            Retour à la liste des commissions
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      breadcrumb={
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/committees">Commissions</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Travaux</BreadcrumbLink>
          </BreadcrumbItem>
        </>
      }
      title={`Travaux de ${committee.title}`}
      description="Gérez les travaux et publications de cette commission citoyenne"
    >
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/admin/committees')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux commissions
        </Button>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Liste des travaux</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un travail
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* Updated modal props to match the new interface */}
          {isModalOpen && (
            <CommitteeWorkModal 
              committeeId={id} 
              open={isModalOpen} 
              onOpenChange={() => setIsModalOpen(false)} 
            />
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

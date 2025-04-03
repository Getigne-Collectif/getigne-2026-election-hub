
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CommitteeDetailsForm from '@/components/admin/committees/CommitteeDetailsForm';
import CommitteeMembersManagement from '@/components/admin/committees/CommitteeMembers';

type Committee = {
  id: string;
  title: string;
  description: string;
  icon: string;
  team_photo_url?: string | null;
  cover_photo_url?: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminCommitteeEditorPage() {
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(false);
  const [committee, setCommittee] = useState<Committee | null>(null);

  // Fetch committee data when component mounts or id changes
  useEffect(() => {
    const fetchCommittee = async () => {
      if (!isEditMode) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('citizen_committees')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        console.log("Fetched committee data:", data);
        setCommittee(data);
      } catch (error) {
        console.error('Erreur lors du chargement de la commission:', error);
        toast.error("Impossible de charger les données de la commission");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommittee();
  }, [id, isEditMode]);

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
            <BreadcrumbLink>
              {isEditMode ? 'Modifier' : 'Créer'}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </>
      }
      title={isEditMode ? "Modifier la commission" : "Créer une commission"}
      description={isEditMode 
        ? "Modifiez les détails de la commission et gérez ses membres"
        : "Créez une nouvelle commission citoyenne"
      }
    >
      <div className="max-w-3xl mx-auto mb-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="details">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="details" className="flex-1">Détails</TabsTrigger>
            {isEditMode && <TabsTrigger value="members" className="flex-1">Membres</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="details">
            <CommitteeDetailsForm 
              isEditMode={isEditMode} 
              committeeId={id} 
              initialData={committee}
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="members">
            {isEditMode && id && (
              <CommitteeMembersManagement committeeId={id} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

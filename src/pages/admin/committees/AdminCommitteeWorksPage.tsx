
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import AdminLayout from '@/components/admin/AdminLayout';
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import CommitteeWorkModal from '@/components/CommitteeWorkModal';
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

type CommitteeData = {
  id: string;
  title: string;
  description: string;
}

type CommitteeWork = {
  id: string;
  title: string;
  content: string;
  date: string;
  committee_id: string;
  created_at: string;
  images: any; // Changed from any[] to any to accommodate Json type from Supabase
  files: any; // Changed from any[] to any to accommodate Json type from Supabase
}

export default function AdminCommitteeWorksPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [committee, setCommittee] = useState<CommitteeData | null>(null);
  const [works, setWorks] = useState<CommitteeWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState<CommitteeWork | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
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

  // Fetch committee works
  const fetchCommitteeWorks = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('committee_works')
        .select('*')
        .eq('committee_id', id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      setWorks(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des comptes-rendus:', error);
      toast.error("Impossible de charger les comptes-rendus");
    }
  };

  useEffect(() => {
    if (committee) {
      fetchCommitteeWorks();
    }
  }, [committee, id]);

  const handleOpenModal = (work: CommitteeWork | null, mode: 'view' | 'edit' | 'create') => {
    setSelectedWork(work);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (work: CommitteeWork) => {
    setSelectedWork(work);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedWork) return;
    
    try {
      const { error } = await supabase
        .from('committee_works')
        .delete()
        .eq('id', selectedWork.id);
      
      if (error) throw error;
      
      toast.success("Le compte-rendu a été supprimé avec succès");
      fetchCommitteeWorks(); // Refresh the list
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la suppression du compte-rendu:', error);
      toast.error("Impossible de supprimer le compte-rendu");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

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
            <BreadcrumbLink>Comptes-rendus</BreadcrumbLink>
          </BreadcrumbItem>
        </>
      }
      title={`Comptes-rendus de ${committee.title}`}
      description="Gérez les comptes-rendus et publications de cette commission citoyenne"
    >
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/admin/committees')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux commissions
        </Button>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Liste des comptes-rendus</h2>
        <Button onClick={() => handleOpenModal(null, 'create')}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un compte-rendu
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {works.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun compte-rendu disponible pour cette commission.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[180px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {works.map((work) => (
                  <TableRow key={work.id}>
                    <TableCell className="font-medium">{work.title}</TableCell>
                    <TableCell>{formatDate(work.date)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleOpenModal(work, 'view')}
                      >
                        <Eye className="h-4 w-4 mr-1" /> Voir
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenModal(work, 'edit')}
                      >
                        <Pencil className="h-4 w-4 mr-1" /> Modifier
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteClick(work)}
                      >
                        <Trash className="h-4 w-4 mr-1" /> Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {isModalOpen && (
            <CommitteeWorkModal 
              committeeId={id!} 
              work={selectedWork} 
              open={isModalOpen} 
              onOpenChange={setIsModalOpen}
              onSuccess={fetchCommitteeWorks}
              mode={modalMode}
            />
          )}

          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer ce compte-rendu ? Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm}>
                  Supprimer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

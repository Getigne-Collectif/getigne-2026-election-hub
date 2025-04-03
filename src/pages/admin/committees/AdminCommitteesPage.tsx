
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, ChevronRight, Edit, Trash2, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import AdminLayout from '@/components/admin/AdminLayout';
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import CommitteeMembers, { getMemberCount } from '@/components/CommitteeMembers';
import { Badge } from '@/components/ui/badge';

// Type pour les commissions
type Committee = {
  id: string;
  title: string;
  description: string;
  icon: string;
  memberCount?: number;
  team_photo_url?: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminCommitteesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [committeeToDelete, setCommitteeToDelete] = useState<Committee | null>(null);
  const [expandedCommittee, setExpandedCommittee] = useState<string | null>(null);

  // Fetch committees
  const { data: committees = [], refetch, isLoading } = useQuery({
    queryKey: ['admin-committees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citizen_committees')
        .select('*')
        .order('title', { ascending: true });

      if (error) {
        toast.error("Erreur lors du chargement des commissions");
        throw error;
      }

      // Get member count for each committee
      const committeesWithMembers: Committee[] = [];

      for (const committee of data || []) {
        const memberCount = await getMemberCount(committee.id);

        committeesWithMembers.push({
          ...committee,
          memberCount
        });
      }

      return committeesWithMembers;
    }
  });

  // Filter committees based on search query
  const filteredCommittees = committees.filter(committee =>
    committee.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    committee.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Delete committee
  const confirmDelete = async () => {
    if (!committeeToDelete) return;

    const { error } = await supabase
      .from('citizen_committees')
      .delete()
      .eq('id', committeeToDelete.id);

    if (error) {
      toast.error("Erreur lors de la suppression de la commission");
      return;
    }

    toast.success("Commission supprimée avec succès");
    setCommitteeToDelete(null);
    refetch();
  };

  // Toggle expanded committee
  const toggleExpanded = (id: string) => {
    if (expandedCommittee === id) {
      setExpandedCommittee(null);
    } else {
      setExpandedCommittee(id);
    }
  };

  return (
    <AdminLayout
      breadcrumb={
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/committees">Commissions</BreadcrumbLink>
          </BreadcrumbItem>
        </>
      }
      title="Gestion des commissions"
      description="Créez et gérez les commissions citoyennes et leurs membres"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une commission..."
              className="w-full sm:w-[300px] pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button asChild>
              <Link to="/admin/committees/new">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle commission
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-md border shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Titre</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Membres</TableHead>
                <TableHead className="w-[180px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Chargement des commissions...
                  </TableCell>
                </TableRow>
              ) : filteredCommittees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "Aucune commission ne correspond à votre recherche" : "Aucune commission n'a été créée"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCommittees.map((committee) => (
                  <>
                    <TableRow
                      key={committee.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpanded(committee.id)}
                    >
                      <TableCell className="font-medium flex items-center">
                        <span className="flex-1">{committee.title}</span>
                        <ChevronRight className={`h-5 w-5 transition-transform ${expandedCommittee === committee.id ? 'rotate-90' : ''}`} />
                      </TableCell>
                      <TableCell className="max-w-[400px] truncate">
                        {committee.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-white">
                          {committee.memberCount || 0} membres
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-2">
                          <Button variant="outline" size="icon" asChild>
                            <Link to={`/admin/committees/edit/${committee.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCommitteeToDelete(committee)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedCommittee === committee.id && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-muted/20 px-6 py-4">
                          <div className="text-sm">
                            <h4 className="text-base font-medium mb-4">Membres de la commission</h4>
                            <CommitteeMembers committeeId={committee.id} simplified />
                            <div className="mt-4">
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/admin/committees/members/${committee.id}`}>
                                  <Users className="h-4 w-4 mr-2" />
                                  Gérer les membres
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!committeeToDelete} onOpenChange={(open) => !open && setCommitteeToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la commission</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la commission "{committeeToDelete?.title}" ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommitteeToDelete(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

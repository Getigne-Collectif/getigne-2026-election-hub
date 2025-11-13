import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import TeamMemberForm from '@/components/admin/team/TeamMemberForm';

const AdminTeamMemberNewPage = () => {
  const { isAdmin, authChecked, isRefreshingRoles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authChecked) return;
    if (isRefreshingRoles) return;

    if (!isAdmin) {
      navigate('/');
      toast({
        title: 'Accès refusé',
        description: "Vous n'avez pas les droits pour accéder à cette page.",
        variant: 'destructive',
      });
    }
  }, [authChecked, isAdmin, navigate, toast, isRefreshingRoles]);

  if (!isAdmin) {
    return null;
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Nouveau membre | Admin</title>
      </Helmet>

      <AdminLayout>
        <div className="py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Nouveau membre</h1>
            <p className="text-muted-foreground">
              Ajoutez un nouveau membre à l'équipe du collectif
            </p>
          </div>

          <TeamMemberForm />
        </div>
      </AdminLayout>
    </HelmetProvider>
  );
};

export default AdminTeamMemberNewPage;



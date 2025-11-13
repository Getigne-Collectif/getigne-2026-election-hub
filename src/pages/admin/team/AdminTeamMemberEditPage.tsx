import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import TeamMemberForm from '@/components/admin/team/TeamMemberForm';

const AdminTeamMemberEditPage = () => {
  const { id } = useParams<{ id: string }>();
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
        <title>Modifier le membre | Admin</title>
      </Helmet>

      <AdminLayout>
        <div className="py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Modifier le membre</h1>
            <p className="text-muted-foreground">
              Modifiez les informations du membre de l'équipe
            </p>
          </div>

          <TeamMemberForm memberId={id} />
        </div>
      </AdminLayout>
    </HelmetProvider>
  );
};

export default AdminTeamMemberEditPage;



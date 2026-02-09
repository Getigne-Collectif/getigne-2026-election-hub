import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useAuth } from '@/context/auth';
import { useToast } from '@/components/ui/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExternalContactsAdminSection from '@/components/admin/external/ExternalContactsAdminSection';
import ExternalGroupsAdminSection from '@/components/admin/external/ExternalGroupsAdminSection';

const AdminExternalDirectoryPage = () => {
  const { isAdmin, authChecked, isRefreshingRoles } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const activeTab = searchParams.get('tab') || 'contacts';
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (!isAdmin && authChecked) {
    return null;
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Annuaire externe | Admin</title>
      </Helmet>

      <AdminLayout noContainer>
        <div className="py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Annuaire</h1>
            <p className="text-muted-foreground">
              Contacts et groupes externes du collectif
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="groups">Groupes</TabsTrigger>
            </TabsList>

            <TabsContent value="contacts">
              <ExternalContactsAdminSection showHeader={false} />
            </TabsContent>

            <TabsContent value="groups">
              <ExternalGroupsAdminSection showHeader={false} />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </HelmetProvider>
  );
};

export default AdminExternalDirectoryPage;

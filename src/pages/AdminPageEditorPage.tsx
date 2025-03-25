
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import PageEditorHeader from '@/components/admin/PageEditorHeader';
import PageEditorForm from '@/components/admin/PageEditorForm';

const AdminPageEditorPage = () => {
  const { id } = useParams();
  const { user, isAdmin, authChecked } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditMode = !!id;

  useEffect(() => {
    if (!authChecked) return;

    if (!user) {
      toast({
        title: 'Accès refusé',
        description: "Veuillez vous connecter pour accéder à cette page.",
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    if (user && !isAdmin) {
      toast({
        title: 'Accès refusé',
        description: "Vous n'avez pas les droits d'accès à cette page.",
        variant: 'destructive'
      });
      navigate('/');
      return;
    }
  }, [user, isAdmin, authChecked, navigate]);

  return (
    <AdminLayout>
      <PageEditorHeader isEditMode={isEditMode} />
      <PageEditorForm id={id} />
    </AdminLayout>
  );
};

export default AdminPageEditorPage;

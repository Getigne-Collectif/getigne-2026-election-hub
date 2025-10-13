
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.tsx';
import { useToast } from '@/hooks/use-toast.ts';
import AdminLayout from '@/components/admin/AdminLayout.tsx';
import PageEditorForm from '@/components/admin/PageEditorForm.tsx';
import {BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator} from "@/components/ui/breadcrumb.tsx";
import {Button} from "@/components/ui/button.tsx";
import {ArrowLeft} from "lucide-react";

const AdminPageEditorPage = () => {
  const { id } = useParams();
  const { user, isAdmin, authChecked, isRefreshingRoles } = useAuth();
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

    if (isRefreshingRoles) return;

    if (user && !isAdmin) {
      toast({
        title: 'Accès refusé',
        description: "Vous n'avez pas les droits d'accès à cette page.",
        variant: 'destructive'
      });
      navigate('/');
      return;
    }
  }, [user, isAdmin, authChecked, navigate, isRefreshingRoles]);
  const breadcrumb = <>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink>{isEditMode ? "Modifier la page" : "Nouvelle page"}</BreadcrumbLink>
      </BreadcrumbItem>
    </>

  return (
    <AdminLayout breadcrumb={breadcrumb} backLink={<div className="flex items-center gap-4 my-4">
      <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/pages')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>
      <h1 className="text-2xl font-bold">{isEditMode ? "Modifier la page" : "Créer une page"}</h1>
    </div>}>
      <PageEditorForm id={id} />
    </AdminLayout>
  );
};

export default AdminPageEditorPage;

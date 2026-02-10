import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useAuth } from '@/context/AuthContext.tsx';
import { useToast } from '@/components/ui/use-toast.ts';
import { supabase } from '@/integrations/supabase/client.ts';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/admin/AdminLayout.tsx';
import LexiconEntryForm from '@/components/admin/lexicon/LexiconEntryForm';
import { Routes } from '@/routes';
import { OutputData } from '@editorjs/editorjs';

interface LexiconEntryFormData {
  name: string;
  acronym: string;
  content: OutputData;
  external_link: string;
  logo_url: string | null;
}

const AdminLexiconEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { user, isAdmin, authChecked, isRefreshingRoles } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultValues, setDefaultValues] = useState<Partial<LexiconEntryFormData>>();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (isRefreshingRoles) return;

    if (user && isAdmin) {
      setIsAuthorized(true);
      if (isEditMode) {
        loadEntry();
      }
    } else {
      setIsAuthorized(false);
      if (user) {
        toast({
          variant: 'destructive',
          title: 'Accès restreint',
          description: "Vous n'avez pas les droits nécessaires pour accéder à cette page.",
        });
        navigate('/');
      } else {
        navigate('/auth');
      }
    }
    setIsChecking(false);
  }, [user, isAdmin, authChecked, navigate, toast, isRefreshingRoles, isEditMode]);

  const loadEntry = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lexicon_entries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Entrée non trouvée',
        });
        navigate(Routes.ADMIN_LEXICON);
        return;
      }

      setDefaultValues({
        name: data.name,
        acronym: data.acronym || '',
        content: data.content || {
          time: Date.now(),
          blocks: [],
          version: '2.28.0',
        },
        external_link: data.external_link || '',
        logo_url: data.logo_url,
      });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'entrée:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger l\'entrée',
      });
      navigate(Routes.ADMIN_LEXICON);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: LexiconEntryFormData) => {
    try {
      setIsSubmitting(true);

      const dataToSave = {
        name: formData.name,
        acronym: formData.acronym || null,
        content: formData.content,
        external_link: formData.external_link || null,
        logo_url: formData.logo_url,
      };

      if (isEditMode && id) {
        // Mise à jour
        const { error } = await supabase
          .from('lexicon_entries')
          .update(dataToSave)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'L\'entrée a été mise à jour avec succès',
        });
      } else {
        // Création
        const { error } = await supabase
          .from('lexicon_entries')
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'L\'entrée a été créée avec succès',
        });
      }

      navigate(Routes.ADMIN_LEXICON);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: `Impossible de ${isEditMode ? 'mettre à jour' : 'créer'} l'entrée`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(Routes.ADMIN_LEXICON);
  };

  if (isChecking || !authChecked || isRefreshingRoles || (isEditMode && isLoading)) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <HelmetProvider>
      <AdminLayout
        title={isEditMode ? 'Modifier l\'entrée' : 'Nouvelle entrée'}
        description={
          isEditMode
            ? 'Modifier les informations de l\'entrée du lexique'
            : 'Créer une nouvelle entrée dans le lexique'
        }
        backLink={
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Retour au lexique
          </Button>
        }
      >
        <Helmet>
          <title>
            {isEditMode ? 'Modifier l\'entrée' : 'Nouvelle entrée'} - Lexique - Administration
          </title>
        </Helmet>

        {(!isEditMode || defaultValues) && (
          <LexiconEntryForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            defaultValues={defaultValues}
            isSubmitting={isSubmitting}
            submitLabel={isEditMode ? 'Mettre à jour' : 'Créer'}
          />
        )}
      </AdminLayout>
    </HelmetProvider>
  );
};

export default AdminLexiconEditorPage;


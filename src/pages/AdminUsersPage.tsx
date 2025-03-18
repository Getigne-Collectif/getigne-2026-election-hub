
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import UserManagement from '@/components/UserManagement';
import { toast } from '@/components/ui/use-toast';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";
import {Home} from "lucide-react";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  [key: string]: string | number | object | boolean;
}

interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  first_name: string;
  last_name: string;
  roles: string[];
}

const AdminUsersPage = () => {
  const { user, isAdmin, userRoles } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Instead of using the admin API, we'll query the auth.users indirectly
      // First, get all profiles from the profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      if (!profiles) {
        setUsers([]);
        return;
      }

      // Get user roles for each profile
      const usersData: UserWithRoles[] = await Promise.all(
        profiles.map(async (profile) => {
          // Get user roles
          // @ts-expect-error - don't know why
          const { data: roles } = await supabase.rpc('get_user_roles', { uid: profile.id });

          // Get user email from auth metadata if available
          // Note: we won't have access to this directly, so we'll use what's available

          return {
            id: profile.id,
            email: '', // We don't have direct access to emails
            created_at: profile.created_at,
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            roles: roles || []
          };
        })
      );

      setUsers(usersData);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Impossible de récupérer la liste des utilisateurs.",
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: 'moderator' | 'admin', action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        // Ajouter un rôle
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (error) throw error;
        toast({
          title: 'Succès',
          description: `Le rôle ${role} a été ajouté.`
        });
      } else {
        // Supprimer un rôle
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);

        if (error) throw error;
        toast({
          title: 'Succès',
          description: `Le rôle ${role} a été retiré.`
        });
      }

      // Rafraîchir la liste des utilisateurs
      await fetchUsers();
    } catch (error: any) {
      console.error('Erreur lors de la modification du rôle:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Une erreur est survenue lors de la modification du rôle.",
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      // Attendre que le statut d'authentification soit chargé
      if (user === null || (user && userRoles.length > 0)) {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [user, userRoles]);

  useEffect(() => {
    if (!authChecked) return;

    // Rediriger si l'utilisateur n'est pas admin
    if (!user) {
      console.log("AdminUsersPage - Redirection: User not authenticated");
      toast({
        title: 'Accès refusé',
        description: "Veuillez vous connecter pour accéder à cette page.",
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    if (user && !isAdmin) {
      console.log("AdminUsersPage - Redirection: User not admin", { userRoles });
      toast({
        title: 'Accès refusé',
        description: "Vous n'avez pas les droits d'accès à cette page.",
        variant: 'destructive'
      });
      navigate('/');
      return;
    }

    if (user && isAdmin) {
      console.log("AdminUsersPage - Fetching users as admin");
      fetchUsers();
    }
  }, [user, isAdmin, authChecked, navigate]);

  return (
      <div>
        <div className="min-h-screen">
          <Navbar />

          {/* Header */}
          <div className="pt-24 pb-12 bg-getigne-50">
            <div className="container mx-auto px-4">
              <Breadcrumb className="mb-6">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">
                      <Home className="h-4 w-4 mr-1" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Administration</BreadcrumbPage>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Utilisateurs</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="max-w-3xl mx-auto text-center">
                <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                  Administration
                </span>
                <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Utilisateurs</h1>
                <p className="text-getigne-700 text-lg mb-6">
                  Gérez les utilisateurs et leurs rôles.
                </p>
              </div>
            </div>
          </div>

          <section className="py-16">
            <div className="container mx-auto px-4">

              {!authChecked ? (
                <div className="text-center py-10">
                  <p>Vérification des droits d'accès...</p>
                </div>
              ) : !user ? (
                <div className="text-center py-10">
                  <p>Veuillez vous connecter pour accéder à l'administration.</p>
                </div>
              ) : !isAdmin ? (
                <div className="text-center py-10">
                  <p>Vous n'avez pas les droits pour accéder à cette page.</p>
                </div>
              ) : (
                <UserManagement
                  users={users}
                  loading={loading}
                  onRoleChange={handleRoleChange}
                />
              )}
            </div>
          </section>
        </div>
      <Footer />
    </div>
  );
};

export default AdminUsersPage;

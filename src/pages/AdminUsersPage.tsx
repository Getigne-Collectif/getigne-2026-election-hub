
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
  email?: string;
  status?: string;
  is_member?: boolean;
  [key: string]: string | number | object | boolean | undefined;
}

interface InvitedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  status: string;
}

interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  first_name: string;
  last_name: string;
  status?: string;
  roles: string[];
  is_member?: boolean;
}

interface InviteUserData {
  first_name: string;
  last_name: string;
  email: string;
}

const AdminUsersPage = () => {
  const { user, isAdmin, userRoles, loading, authChecked, refreshUserRoles } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const fetchUsers = async () => {
    setPageLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      if (!profiles) {
        setUsers([]);
        return;
      }

      const { data: invitedUsers, error: invitedError } = await supabase
        .from('invited_users')
        .select('*');

      if (invitedError) console.error("Erreur lors de la récupération des invitations:", invitedError);

      // Récupérer tous les profils avec leurs rôles
      const profilesData = await Promise.all(
        profiles.map(async (profile: Profile) => {
          const { data: roles } = await supabase.rpc('get_user_roles', { uid: profile.id });

          return {
            id: profile.id,
            email: profile.email || '',
            created_at: String(profile.created_at),
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            status: profile.status || 'active',
            is_member: profile.is_member === true, // Ensure boolean type
            roles: roles || []
          };
        })
      );

      // Obtenir les IDs des profils existants pour filtrer les invitations
      const existingProfileIds = profiles.map((profile: Profile) => profile.id);

      // Filtrer pour ne garder que les invitations qui n'ont pas encore été converties en utilisateurs
      const pendingInvitations = invitedUsers ? invitedUsers.filter((invited: InvitedUser) => 
        !existingProfileIds.includes(invited.id)
      ) : [];

      // Enrichir les profils avec les emails des invitations si nécessaire
      const enrichedProfiles = profilesData.map(profile => {
        // Si l'email du profil est vide, chercher s'il existe une invitation avec cet ID
        if (!profile.email && invitedUsers) {
          const matchingInvite = invitedUsers.find(invite => invite.id === profile.id);
          if (matchingInvite) {
            return {
              ...profile,
              email: matchingInvite.email
            };
          }
        }
        return profile;
      });

      // Ajouter les invitations en attente à la liste des utilisateurs
      const allUsers: UserWithRoles[] = [...enrichedProfiles];
      
      if (pendingInvitations.length > 0) {
        pendingInvitations.forEach((invited: InvitedUser) => {
          allUsers.push({
            id: invited.id,
            email: invited.email,
            created_at: String(invited.created_at),
            first_name: invited.first_name || '',
            last_name: invited.last_name || '',
            status: 'invited',
            roles: []
          });
        });
      }

      setUsers(allUsers);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Impossible de récupérer la liste des utilisateurs.",
        variant: 'destructive'
      });
    } finally {
      setPageLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: 'moderator' | 'admin', action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (error) throw error;
        
        // Si l'utilisateur modifie son propre rôle, rafraîchir ses rôles
        if (userId === user?.id) {
          await refreshUserRoles();
        }
        
        toast({
          title: 'Succès',
          description: `Le rôle ${role} a été ajouté.`
        });
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);

        if (error) throw error;
        
        // Si l'utilisateur modifie son propre rôle, rafraîchir ses rôles
        if (userId === user?.id) {
          await refreshUserRoles();
        }
        
        toast({
          title: 'Succès',
          description: `Le rôle ${role} a été retiré.`
        });
      }

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

  const handleInviteUser = async (userData: InviteUserData) => {
    try {
      console.log("Inviting user:", userData);

      const { error: insertError } = await supabase
        .from('invited_users')
        .insert({
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name
        });

      if (insertError) throw insertError;

      const { error: inviteError } = await supabase.functions.invoke('invite-user', {
        body: {
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name
        }
      });

      if (inviteError) throw inviteError;

      await fetchUsers();
    } catch (error: any) {
      console.error('Erreur lors de l\'invitation:', error);
      throw error;
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const newStatus = isActive ? 'active' : 'disabled';

      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
    } catch (error: any) {
      console.error('Erreur lors de la modification du statut:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!authChecked) return;

    console.log("AdminUsersPage - Auth checked:", { user: !!user, isAdmin, userRoles });

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
      
      // Tentative de rafraîchir les rôles si l'utilisateur pense être admin
      refreshUserRoles().then(() => {
        // Vérifier à nouveau après rafraîchissement
        if (!isAdmin) {
          toast({
            title: 'Accès refusé',
            description: "Vous n'avez pas les droits d'accès à cette page.",
            variant: 'destructive'
          });
          navigate('/');
        } else {
          console.log("AdminUsersPage - Access granted after role refresh");
          fetchUsers();
        }
      });
      return;
    }

    if (user && isAdmin) {
      console.log("AdminUsersPage - Fetching users as admin");
      fetchUsers();
    }
  }, [user, isAdmin, authChecked, navigate, refreshUserRoles]);

  return (
    <div>
      <div className="min-h-screen">
        <Navbar />

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
            {!authChecked || loading ? (
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
                <button 
                  onClick={() => refreshUserRoles()}
                  className="mt-4 px-4 py-2 bg-getigne-accent text-white rounded-md hover:bg-getigne-accent/90 transition-colors"
                >
                  Actualiser mes droits
                </button>
              </div>
            ) : (
              <UserManagement
                users={users}
                loading={pageLoading}
                onRoleChange={handleRoleChange}
                onInviteUser={handleInviteUser}
                onToggleUserStatus={handleToggleUserStatus}
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

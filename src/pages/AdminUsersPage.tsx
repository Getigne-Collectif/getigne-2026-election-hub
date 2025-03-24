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
  avatar_url?: string;
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
  avatar_url?: string;
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
  const [invitedUsers, setInvitedUsers] = useState<UserWithRoles[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const fetchUsers = async () => {
    setPageLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: invitedUsersData, error: invitedError } = await supabase
        .from('invited_users')
        .select('*');

      if (invitedError) throw invitedError;

      const profilesData = await Promise.all(
        profiles.map(async (profile: Profile) => {
          const { data: roles } = await supabase.rpc('get_user_roles', { uid: profile.id });
          
          let email = profile.email;
          if (!email && invitedUsersData) {
            const matchingInvite = invitedUsersData.find((invited: InvitedUser) => invited.id === profile.id);
            if (matchingInvite) {
              email = matchingInvite.email;
            }
          }

          return {
            id: profile.id,
            email: email || '',
            created_at: String(profile.created_at),
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            status: profile.status || 'active',
            is_member: profile.is_member === true,
            avatar_url: profile.avatar_url,
            roles: roles || []
          };
        })
      );

      const existingProfileIds = profiles.map((profile: Profile) => profile.id);

      const pendingInvitationsData = invitedUsersData 
        ? invitedUsersData
            .filter((invited: InvitedUser) => !existingProfileIds.includes(invited.id))
            .map((invited: InvitedUser) => ({
              id: invited.id,
              email: invited.email,
              created_at: String(invited.created_at),
              first_name: invited.first_name || '',
              last_name: invited.last_name || '',
              status: 'invited',
              roles: [],
              is_member: false
            }))
        : [];

      setUsers(profilesData);
      setInvitedUsers(pendingInvitationsData);
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

  const handleRoleChange = async (userId: string, role: 'moderator' | 'admin' | 'program_manager', action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (error) throw error;
        
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
      refreshUserRoles().then(() => {
        if (!isAdmin) {
          toast({
            title: 'Accès refusé',
            description: "Vous n'avez pas les droits d'accès à cette page.",
            variant: 'destructive'
          });
          navigate('/');
        } else {
          fetchUsers();
        }
      });
      return;
    }

    if (user && isAdmin) {
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
              </div>
            ) : (
              <UserManagement
                users={users}
                invitedUsers={invitedUsers}
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


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import UserManagement from '@/components/UserManagement';
import { toast } from '@/components/ui/use-toast';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  [key: string]: any;
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

  useEffect(() => {
    // Ajouter des logs pour déboguer l'état de l'authentification
    console.log("AdminUsersPage - Auth state:", { 
      user: user?.id, 
      isAdmin, 
      userRoles 
    });
  }, [user, isAdmin, userRoles]);

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
          const { data: roles } = await supabase
            .rpc('get_user_roles', { uid: profile.id });
            
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8">Administration des utilisateurs</h1>
        
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
      </main>
      <Footer />
    </div>
  );
};

export default AdminUsersPage;

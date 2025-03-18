
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import UserManagement from '@/components/UserManagement';
import { toast } from '@/components/ui/use-toast';

const AdminUsersPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Récupérer la liste des utilisateurs depuis la vue
      const { data, error } = await supabase
        .from('users_with_roles')
        .select('*');

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de récupérer la liste des utilisateurs.",
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
    // Rediriger si l'utilisateur n'est pas admin
    if (user && !isAdmin) {
      toast({
        title: 'Accès refusé',
        description: "Vous n'avez pas les droits d'accès à cette page.",
        variant: 'destructive'
      });
      navigate('/');
      return;
    }

    if (user && isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8">Administration des utilisateurs</h1>
        
        {!user ? (
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

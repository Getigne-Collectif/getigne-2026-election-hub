
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Helmet, HelmetProvider } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Mail, MapPin, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Supporter {
  id: number;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  city: string | null;
  subscribed_to_newsletter: boolean;
}

const AdminSupportCommitteePage = () => {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupporters();
  }, []);

  const fetchSupporters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_committee')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSupporters(data || []);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des signataires:', error);
      toast.error("Erreur lors du chargement des signataires");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce signataire ? Cette action est irréversible.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('support_committee')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Signataire supprimé avec succès");
      setSupporters(supporters.filter(s => s.id !== id));
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error("Une erreur est survenue lors de la suppression");
    }
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>Comité de soutien | Administration | Gétigné Collectif</title>
      </Helmet>

      <AdminLayout 
        title="Comité de soutien" 
        description="Gérez la liste des signataires du comité de soutien."
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-getigne-accent" />
              {supporters.length} {supporters.length > 1 ? 'signataires' : 'signataire'}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Prénom & Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead className="text-center">Newsletter</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                      Chargement des signataires...
                    </TableCell>
                  </TableRow>
                ) : supporters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                      Aucun signataire trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  supporters.map((supporter) => (
                    <TableRow key={supporter.id}>
                      <TableCell className="text-gray-500 flex items-center gap-2 whitespace-nowrap">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(supporter.created_at), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {supporter.first_name} {supporter.last_name}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {supporter.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supporter.city && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            {supporter.city}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {supporter.subscribed_to_newsletter ? (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                            Oui
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-medium">
                            Non
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(supporter.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </AdminLayout>
    </HelmetProvider>
  );
};

export default AdminSupportCommitteePage;

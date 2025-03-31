
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { addParticipativeGroceryProject } from '@/utils/addParticipativeGroceryProject';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function AddGroceryProjectPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleAddProject = async () => {
    setIsLoading(true);
    try {
      await addParticipativeGroceryProject();
      toast.success("Projet d'épicerie participative ajouté avec succès !");
      navigate('/admin/projects');
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'ajout du projet");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AdminLayout
      breadcrumb={
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/projects">Projets</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Ajouter l'épicerie participative</BreadcrumbLink>
          </BreadcrumbItem>
        </>
      }
      title="Ajouter le projet d'épicerie participative"
      description="Ajouter automatiquement le projet d'épicerie participative avec une image"
    >
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-lg mb-8">
          Cette page vous permet d'ajouter automatiquement un projet d'épicerie participative 
          sur le modèle du réseau monépi (monepi.fr). Une image sera également téléchargée 
          pour illustrer ce projet.
        </p>
        
        <Button 
          onClick={handleAddProject} 
          size="lg" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ajout en cours...
            </>
          ) : (
            "Ajouter le projet d'épicerie participative"
          )}
        </Button>
      </div>
    </AdminLayout>
  );
}

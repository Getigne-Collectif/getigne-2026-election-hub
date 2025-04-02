
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Cette page est utilisée comme callback après l'authentification OAuth
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (data.session) {
          toast({
            title: 'Connexion réussie',
            description: 'Vous êtes maintenant connecté.',
          });
        }

        // Redirection vers la page d'accueil après connexion réussie
        navigate('/');
      } catch (error: any) {
        console.error('Erreur dans la callback d\'authentification:', error);
        toast({
          title: 'Erreur lors de la connexion',
          description: error.message || 'Une erreur est survenue lors de la connexion.',
          variant: 'destructive'
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Authentification en cours...</h2>
        <p className="text-gray-500">Veuillez patienter pendant que nous vous connectons.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;

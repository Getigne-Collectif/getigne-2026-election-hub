
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';

const AuthButton = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès"
      });
    } catch (error) {
      console.error('Error during sign out:', error);
      toast({
        title: "Erreur lors de la déconnexion",
        description: "Une erreur est survenue lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm" className="flex items-center gap-2">
        <Link to="/auth">
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Se connecter</span>
        </Link>
      </Button>
    );
  }

  // Déterminer le nom à afficher
  let displayName = user.email;
  
  // Vérifiez si le profil existe et contient les informations de nom
  if (profile?.first_name) {
    displayName = profile.first_name;
  } else if (user.user_metadata?.first_name) {
    // Fallback sur les métadonnées utilisateur si le profil n'est pas disponible
    displayName = user.user_metadata.first_name;
  }

  console.log('AuthButton rendering with profile:', profile);
  console.log('User metadata:', user.user_metadata);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex flex-col items-start">
          {profile ? (
            <>
              <span className="font-medium">{`${profile.first_name} ${profile.last_name}`}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </>
          ) : user.user_metadata?.first_name ? (
            <>
              <span className="font-medium">
                {`${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`}
              </span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">{user.email}</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AuthButton;

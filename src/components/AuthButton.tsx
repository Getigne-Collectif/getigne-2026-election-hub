
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {LogIn, LogOut, User, Shield, Newspaper, RefreshCw} from 'lucide-react';
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
  const { user, profile, signOut, isAdmin, refreshUserRoles } = useAuth();
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

  const handleRefreshRoles = async () => {
    try {
      await refreshUserRoles();
      toast({
        title: "Droits actualisés",
        description: "Vos droits d'accès ont été actualisés"
      });
    } catch (error) {
      console.error('Error refreshing roles:', error);
      toast({
        title: "Erreur d'actualisation",
        description: "Impossible d'actualiser vos droits d'accès",
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
  let displayName = user.email || '';
  let firstName = '';
  let lastName = '';

  if (profile) {
    // Utiliser les données du profil si disponibles
    displayName = profile.first_name || displayName;
    firstName = profile.first_name || '';
    lastName = profile.last_name || '';
  } else if (user.user_metadata) {
    // Fallback sur les métadonnées utilisateur
    firstName = user.user_metadata.first_name || '';
    lastName = user.user_metadata.last_name || '';
    if (firstName) {
      displayName = firstName;
    }
  }

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
          {firstName ? (
            <>
              <span className="font-medium">{`${firstName} ${lastName}`}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">{user.email}</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleRefreshRoles} className="flex items-center">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser mes droits
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link to="/admin/users" className="flex items-center w-full">
                <Shield className="h-4 w-4 mr-2" />
                Admin Utilisateurs
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin/news" className="flex items-center w-full">
                <Newspaper className="h-4 w-4 mr-2" />
                Admin Actualités
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AuthButton;

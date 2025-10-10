
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { Button } from '@/components/ui/button';
import {LogIn, LogOut, UserCog, Settings} from 'lucide-react';
import { Routes } from '@/routes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import UserAvatar, { getUserNames } from '@/components/UserAvatar';

const AuthButton = () => {
  const { user, profile, signOut, isAdmin, isInvitedUser } = useAuth();
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

  const handleProfileClick = () => {
    navigate(Routes.PROFILE);
  };

  const handleAdminClick = () => {
    navigate(Routes.ADMIN);
  };

  // Pas d'utilisateur - afficher bouton connexion
  if (!user) {
    return (
      <Button asChild variant="outline" size="sm" className="flex items-center gap-2">
        <Link to={Routes.AUTH}>
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Se connecter</span>
        </Link>
      </Button>
    );
  }

  const { firstName, lastName, displayName } = getUserNames(user, profile);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <UserAvatar user={user} profile={profile} size="sm" />
          <span className="hidden sm:inline">
            {displayName}
          </span>
          {isInvitedUser && (
            <span className="bg-yellow-100 text-yellow-800 text-xs py-0.5 px-1.5 rounded ml-1">
              Nouveau
            </span>
          )}
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

        <DropdownMenuItem onClick={handleProfileClick} className="flex items-center">
          <UserCog className="h-4 w-4 mr-2" />
          Mon profil
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isAdmin && (
          <DropdownMenuItem onClick={handleAdminClick} className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Administration
        </DropdownMenuItem>
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

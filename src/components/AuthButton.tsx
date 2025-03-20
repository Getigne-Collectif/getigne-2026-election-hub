
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { Button } from '@/components/ui/button';
import {LogIn, LogOut, User, Shield, Newspaper, UserCog, Calendar, Users} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    navigate('/profile');
  };

  // Pas d'utilisateur - afficher bouton connexion
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
    firstName = profile.first_name || '';
    lastName = profile.last_name || '';
    displayName = firstName || displayName;
  } else if (user.user_metadata) {
    // Fallback sur les métadonnées utilisateur
    firstName = user.user_metadata.first_name || '';
    lastName = user.user_metadata.last_name || '';
    if (firstName) {
      displayName = firstName;
    }
  }

  // Obtenir les initiales pour l'avatar
  const getInitials = () => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial || displayName.charAt(0).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          {profile?.avatar_url ? (
            <Avatar className="h-6 w-6">
              <AvatarImage src={profile.avatar_url} alt={displayName} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          ) : (
            <User className="h-4 w-4" />
          )}
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
          {isInvitedUser && (
            <span className="bg-yellow-100 text-yellow-800 text-xs py-0.5 px-1.5 rounded ml-auto">
              Nouveau
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link to="/admin/users" className="flex items-center w-full">
                <Users className="h-4 w-4 mr-2" />
                Utilisateurs
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin/news" className="flex items-center w-full">
                <Newspaper className="h-4 w-4 mr-2" />
                Actualités
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin/events" className="flex items-center w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Agenda
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

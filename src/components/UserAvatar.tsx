import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/context/auth';
import { Users } from 'lucide-react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface UserAvatarProps {
  user: User | null;
  profile: Profile | null;
  size?: AvatarSize;
  className?: string;
  /**
   * If true and there is no user, renders a generic icon instead of empty avatar
   */
  showPlaceholderIfNoUser?: boolean;
}

const sizeToClasses: Record<AvatarSize, string> = {
  xs: 'h-5 w-5',
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12'
};

export const getUserNames = (
  user: User | null,
  profile: Profile | null
): { firstName: string; lastName: string; displayName: string } => {
  let displayName = user?.email || '';
  let firstName = '';
  let lastName = '';

  if (profile) {
    firstName = profile.first_name || '';
    lastName = profile.last_name || '';
    displayName = firstName || displayName;
  } else if (user?.user_metadata) {
    firstName = (user.user_metadata as any).first_name || '';
    lastName = (user.user_metadata as any).last_name || '';
    if (firstName) {
      displayName = firstName;
    }
  }

  return { firstName, lastName, displayName };
};

export const getUserInitials = (
  firstName: string,
  lastName: string,
  displayName: string
): string => {
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  const initials = `${firstInitial}${lastInitial}`.trim();
  return initials || (displayName ? displayName.charAt(0).toUpperCase() : '');
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  profile,
  size = 'sm',
  className,
  showPlaceholderIfNoUser = true
}) => {
  const { firstName, lastName, displayName } = getUserNames(user, profile);

  if (!user && showPlaceholderIfNoUser) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-muted ${sizeToClasses[size]} ${className || ''}`}>
        <Users className={`${sizeToClasses[size]} text-muted-foreground`} />
      </div>
    );
  }

  const initials = getUserInitials(firstName, lastName, displayName);
  const avatarUrl = profile?.avatar_url;

  return (
    <Avatar className={`${sizeToClasses[size]} ${className || ''}`}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={displayName || 'Utilisateur'} />
      ) : null}
      <AvatarFallback>{initials || 'U'}</AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;



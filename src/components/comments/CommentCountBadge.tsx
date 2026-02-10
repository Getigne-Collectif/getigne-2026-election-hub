import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CommentCountBadgeProps {
  totalCount: number;
  unreadCount?: number;
  className?: string;
  showIcon?: boolean;
}

/**
 * Composant affichant le nombre total de commentaires avec un badge rouge
 * pour les nouveaux messages non lus
 */
export default function CommentCountBadge({
  totalCount,
  unreadCount = 0,
  className,
  showIcon = true,
}: CommentCountBadgeProps) {
  if (totalCount === 0) {
    return null;
  }

  const hasUnread = unreadCount > 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && <MessageSquare className="w-4 h-4 text-brand" />}
      <span className="text-sm text-gray-500">
        {totalCount} {totalCount === 1 ? 'message' : 'messages'}
      </span>
      {hasUnread && (
        <Badge
          variant="destructive"
          className="ml-1 h-5 min-w-[20px] px-1.5 text-xs font-semibold flex items-center justify-center"
        >
          {unreadCount}
        </Badge>
      )}
    </div>
  );
}


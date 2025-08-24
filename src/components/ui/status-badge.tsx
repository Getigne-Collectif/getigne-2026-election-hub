import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Check } from 'lucide-react';
import { ProgramPointStatus } from '@/types/program.types';

interface StatusBadgeProps {
  status: ProgramPointStatus;
  onStatusChange?: (newStatus: ProgramPointStatus) => void;
  className?: string;
  disabled?: boolean;
}

const statusConfig = {
  draft: {
    label: 'Brouillon',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-700 border-gray-200'
  },
  pending: {
    label: 'À valider',
    variant: 'outline' as const,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
  },
  validated: {
    label: 'Validé',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-700 border-green-200'
  }
};

export function StatusBadge({ status, onStatusChange, className = '', disabled = false }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  // Si pas de callback de changement ou si désactivé, afficher juste le badge
  if (!onStatusChange || disabled) {
    return (
      <Badge 
        variant={config.variant}
        className={`${config.className} ${className}`}
      >
        {config.label}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`${config.className} ${className} h-auto px-2 py-1 cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105 border`}
        >
          {config.label}
          <ChevronDown className="ml-1 h-3 w-3 transition-transform duration-200" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.entries(statusConfig).map(([statusKey, statusConfigItem]) => (
          <DropdownMenuItem
            key={statusKey}
            onClick={() => onStatusChange(statusKey as ProgramPointStatus)}
            className="flex items-center justify-between cursor-pointer hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${statusConfigItem.className.split(' ')[0]}`} />
              <span>{statusConfigItem.label}</span>
            </div>
            {status === statusKey && (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

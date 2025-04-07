
import React from 'react';
import * as icons from 'lucide-react';

interface DynamicIconProps {
  name?: string;
  size?: number;
  className?: string;
  color?: string;
}

export function DynamicIcon({ 
  name, 
  size = 24, 
  className = "", 
  color, 
  ...props 
}: DynamicIconProps & React.ComponentPropsWithoutRef<'svg'>) {
  const IconComponent = name && (icons as any)[name] ? (icons as any)[name] : icons.Image;

  return <IconComponent size={size} className={className} color={color} {...props} />;
}

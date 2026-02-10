import React from 'react';
import { Button } from '@/components/ui/button';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { downloadFileFromUrl } from '@/lib/utils';

interface CtaBannerProps {
  title: string;
  content?: string;
  iconName?: string;
  buttonLabel: string;
  buttonHref: string;
  buttonTarget?: string;
  className?: string;
  compact?: boolean;
  download?: boolean;
  downloadName?: string;
}

export function CtaBanner({
  title,
  content,
  iconName,
  buttonLabel,
  buttonHref,
  buttonTarget = '_blank',
  className = 'from-brand-600 to-brand',
  compact = false,
  download = false,
  downloadName,
}: CtaBannerProps) {
  const handleClick = async (e: React.MouseEvent) => {
    if (download) {
      e.preventDefault();
      try {
        await downloadFileFromUrl(buttonHref, downloadName);
      } catch (err) {
        // fallback: open in new tab in case of CORS
        window.open(buttonHref, buttonTarget);
      }
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${className} text-white shadow`}>
      <div className={`${compact ? 'p-4' : 'p-6 md:p-8'} ${compact ? 'flex flex-col items-stretch gap-3' : 'flex flex-col md:flex-row md:items-center md:justify-between gap-4'}`}>
        <div className={`flex items-start gap-3 ${compact ? '' : 'md:items-center'}`}>
          {iconName && (
            <div className="shrink-0 p-2 bg-white/15 rounded-lg">
              <DynamicIcon name={iconName} className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className={`${compact ? 'text-base' : 'text-xl'} font-semibold leading-snug line-clamp-2`}>{title}</h3>
            {content && (
              <p className={`text-white/90 mt-1 ${compact ? 'text-sm' : 'text-sm md:text-base'} line-clamp-2`}>{content}</p>
            )}
          </div>
        </div>
        <div>
          <Button onClick={handleClick} className={`bg-white text-brand-900 hover:bg-white/90 ${compact ? 'w-full' : ''}`} size={compact ? 'sm' : 'default'}>
            {iconName && <DynamicIcon name={iconName} className="w-4 h-4 mr-2" />}
            {buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CtaBanner;



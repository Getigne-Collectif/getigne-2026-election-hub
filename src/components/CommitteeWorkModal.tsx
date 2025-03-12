
import React from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type Tables } from '@/integrations/supabase/types';

type CommitteeWork = Tables<'committee_works'>;

interface CommitteeWorkModalProps {
  work: CommitteeWork | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CommitteeWorkModal = ({ work, open, onOpenChange }: CommitteeWorkModalProps) => {
  if (!work) return null;

  const images = (work.images as { url: string; caption: string }[]) || [];
  const files = (work.files as { url: string; name: string; type: string }[]) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{work.title}</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Date */}
          <div className="text-sm text-muted-foreground">
            {new Date(work.date).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>

          {/* Content */}
          <div className="text-base leading-relaxed whitespace-pre-wrap">
            {work.content}
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map((image, index) => (
                  <figure key={index} className="relative">
                    <img
                      src={image.url}
                      alt={image.caption}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    {image.caption && (
                      <figcaption className="mt-2 text-sm text-muted-foreground">
                        {image.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Documents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {files.map((file, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    asChild
                  >
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      <span>{file.name}</span>
                      <span className="text-xs uppercase text-muted-foreground">
                        {file.type}
                      </span>
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommitteeWorkModal;

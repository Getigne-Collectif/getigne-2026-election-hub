
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Tables } from '@/integrations/supabase/types';
import { Calendar } from 'lucide-react';

interface CommitteeWorkModalProps {
  work: Tables<'committee_works'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CommitteeWorkModal = ({ work, open, onOpenChange }: CommitteeWorkModalProps) => {
  if (!work) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{work.title}</DialogTitle>
          <DialogDescription className="flex items-center mt-2 text-getigne-500">
            <Calendar size={16} className="mr-1" />
            <time>{formatDate(work.date)}</time>
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6">
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: work.content }} />
          </div>

          {(work.images as any[])?.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(work.images as any[]).map((image, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden">
                    <img 
                      src={image.url} 
                      alt={image.alt || `Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {(work.files as any[])?.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Documents</h3>
              <div className="space-y-2">
                {(work.files as any[]).map((file, index) => (
                  <a 
                    key={index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 border border-getigne-100 rounded-lg hover:bg-getigne-50 transition-colors"
                  >
                    <div className="text-getigne-700">
                      <div className="font-medium">{file.name}</div>
                      {file.size && (
                        <div className="text-sm text-getigne-500">
                          {Math.round(file.size / 1024)} Ko
                        </div>
                      )}
                    </div>
                  </a>
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

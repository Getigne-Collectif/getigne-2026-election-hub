
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import ProgramLikeButton from './ProgramLikeButton';
import Comments from '../comments';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ProgramPoint } from '@/types/program.types';

interface ProgramPointCardProps {
  point: ProgramPoint;
  programItemId: string;
}

export default function ProgramPointCard({ point, programItemId }: ProgramPointCardProps) {
  const [showContent, setShowContent] = useState(false);

  const downloadFile = (fileUrl: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.download = fileUrl.split('/').pop() || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card key={point.id} className="border-getigne-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-getigne-800">{point.title}</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowContent(!showContent)}
          >
            {showContent ? 'Masquer' : 'Développer'}
          </Button>
        </div>
        
        {showContent && (
          <>
            <div className="prose max-w-none rich-content mb-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{point.content}</ReactMarkdown>
            </div>

            {point.files && point.files.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Fichiers attachés</h4>
                <div className="space-y-2">
                  {point.files.map((fileUrl, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <span className="text-sm truncate">{fileUrl.split('/').pop()}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => downloadFile(fileUrl)}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1 text-getigne-600"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Commenter</span>
              </Button>
              
              <ProgramLikeButton programItemId={programItemId} pointId={point.id} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

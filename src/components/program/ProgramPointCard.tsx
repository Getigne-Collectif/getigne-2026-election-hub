
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import ProgramLikeButton from './ProgramLikeButton';
import Comments from '../comments';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ProgramPointCardProps {
  point: {
    id: string;
    content: string;
    position: number;
  };
  programItemId: string;
}

export default function ProgramPointCard({ point, programItemId }: ProgramPointCardProps) {
  const [showComments, setShowComments] = useState(false);

  return (
    <Card key={point.id} className="border-getigne-200">
      <CardContent className="p-4">
        <div className="prose max-w-none rich-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{point.content}</ReactMarkdown>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1 text-getigne-600" 
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Commenter</span>
          </Button>
          
          <ProgramLikeButton programItemId={programItemId} pointId={point.id} />
        </div>
        
        {showComments && (
          <>
            <Separator className="my-4" />
            <div className="pt-2">
              <Comments programItemId={programItemId} programPointId={point.id} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

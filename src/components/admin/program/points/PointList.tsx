import { Droppable, Draggable } from '@hello-pangea/dnd';
import { ProgramPoint, ProgramPointStatus } from '@/types/program.types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PointListProps {
  points: ProgramPoint[];
  onEdit: (point: ProgramPoint) => void;
  onDelete: (pointId: string) => void;
  onStatusChange: (pointId: string, newStatus: ProgramPointStatus) => void;
  isReordering: boolean;
}

export default function PointList({ points, onEdit, onDelete, onStatusChange, isReordering }: PointListProps) {
  return (
    <Droppable droppableId="program-points">
      {(provided) => (
        <div 
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="space-y-2"
        >
          {points.map((point, index) => (
            <Draggable 
              key={point.id} 
              draggableId={point.id} 
              index={index}
              isDragDisabled={isReordering}
            >
              {(provided) => (
                <Card
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  className="border"
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div 
                        {...provided.dragHandleProps}
                        className="flex items-center cursor-grab text-muted-foreground"
                        aria-label="Déplacer"
                      >
                        <GripVertical className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-getigne-800">{point.title}</h4>
                          <StatusBadge 
                            status={point.status} 
                            onStatusChange={(newStatus) => onStatusChange(point.id, newStatus)}
                            className="ml-2"
                          />
                        </div>
                        <div className="prose prose-sm max-w-none text-muted-foreground line-clamp-2">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {point.content || ''}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <div className="flex gap-2 items-start ml-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onEdit(point)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Modifier</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-red-500"
                          onClick={() => onDelete(point.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Supprimer</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

import { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { ProgramPoint, ProgramPointStatus } from '@/types/program.types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import EditorJSRenderer from '@/components/EditorJSRenderer';

interface PointListProps {
  points: ProgramPoint[];
  onEdit: (point: ProgramPoint) => void;
  onDelete: (pointId: string) => void;
  onStatusChange: (pointId: string, newStatus: ProgramPointStatus) => void;
  isReordering: boolean;
}

export default function PointList({ points, onEdit, onDelete, onStatusChange, isReordering }: PointListProps) {
  const [expandedPoints, setExpandedPoints] = useState<Set<string>>(new Set());

  const toggleExpand = (pointId: string) => {
    setExpandedPoints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pointId)) {
        newSet.delete(pointId);
      } else {
        newSet.add(pointId);
      }
      return newSet;
    });
  };

  return (
    <Droppable droppableId="program-points">
      {(provided) => (
        <div 
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="space-y-2"
        >
          {points.map((point, index) => {
            const isExpanded = expandedPoints.has(point.id);
            return (
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
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                {point.number != null && (
                                  <span className="shrink-0 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1 rounded bg-muted text-muted-foreground text-xs font-medium">
                                    n°{point.number}
                                  </span>
                                )}
                                <h4 className="font-medium text-brand-800">{point.title}</h4>
                              </div>
                              {point.competent_entity && (
                                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                  {point.competent_entity.name}
                                </span>
                              )}
                            </div>
                            <StatusBadge
                              status={point.status}
                              onStatusChange={(newStatus) => onStatusChange(point.id, newStatus)}
                              className="ml-2"
                            />
                          </div>
                          {isExpanded && (
                            <div className="mt-3 prose prose-sm max-w-none text-muted-foreground">
                              <EditorJSRenderer data={point.content || ''} />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 items-start ml-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => toggleExpand(point.id)}
                            title={isExpanded ? "Réduire" : "Développer"}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            <span className="sr-only">{isExpanded ? "Réduire" : "Développer"}</span>
                          </Button>
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
            );
          })}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/auth';
import LiftPostForm from './LiftPostForm';
import LiftMessageModal from './LiftMessageModal';

interface LiftPostCardProps {
  post: any;
  onUpdate: () => void;
}

const LiftPostCard: React.FC<LiftPostCardProps> = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const isOwner = user?.id === post.user_id;

  const formatTime = (timeStart: string, timeEnd: string, isFlexible: boolean) => {
    if (isFlexible && timeEnd) {
      return `${timeStart} - ${timeEnd}`;
    }
    return timeStart;
  };

  const getRecurrenceText = (recurrence: string, date: string) => {
    if (recurrence === 'once') return null;
    
    switch (recurrence) {
      case 'daily': return 'Tous les jours';
      case 'weekly': 
        const dayName = format(new Date(date), 'EEEE', { locale: fr });
        return `Chaque ${dayName}`;
      default: return recurrence;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'd MMMM yyyy', { locale: fr });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr;
    }
  };

  return (
    <>
      <Card className="border-blue-200 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg text-blue-900">
              {post.departure_location} → {post.arrival_location}
            </CardTitle>
            {isOwner && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEditForm(true)}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <Edit size={16} className="mr-1" />
                Modifier
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              <Calendar size={12} className="mr-1" />
              {post.date ? formatDate(post.date) : 'Date non définie'}
            </Badge>
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              <Clock size={12} className="mr-1" />
              {post.time_start ? formatTime(post.time_start, post.time_end, post.is_flexible_time) : 'Horaire flexible'}
            </Badge>
            {getRecurrenceText(post.recurrence, post.date) && (
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                {getRecurrenceText(post.recurrence, post.date)}
              </Badge>
            )}
          </div>

          {post.description && (
            <p className="text-gray-700 text-sm line-clamp-3">
              {post.description}
            </p>
          )}

          {!isOwner && (
            <Button
              onClick={() => setShowMessageModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {post.type === 'offer' ? "Ça m'intéresse" : "Je propose un covoit"}
            </Button>
          )}
        </CardContent>
      </Card>

      <LiftPostForm
        type={post.type}
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSuccess={onUpdate}
        editPost={post}
      />

      <LiftMessageModal
        post={post}
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        onSuccess={() => setShowMessageModal(false)}
      />
    </>
  );
};

export default LiftPostCard;

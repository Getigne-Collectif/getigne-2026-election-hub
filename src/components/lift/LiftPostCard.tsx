
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Calendar, Edit } from 'lucide-react';
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

  const getRecurrenceText = (recurrence: string) => {
    switch (recurrence) {
      case 'daily': return 'Tous les jours';
      case 'weekly': return 'Toutes les semaines';
      case 'once': return 'Une fois';
      default: return recurrence;
    }
  };

  return (
    <>
      <Card className="border-orange-200 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg text-orange-900">
              {post.departure_location} → {post.arrival_location}
            </CardTitle>
            {isOwner && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEditForm(true)}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <Edit size={16} className="mr-1" />
                Modifier
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-orange-700 border-orange-300">
              <Calendar size={12} className="mr-1" />
              {post.day}
            </Badge>
            <Badge variant="outline" className="text-orange-700 border-orange-300">
              <Clock size={12} className="mr-1" />
              {post.time_start ? formatTime(post.time_start, post.time_end, post.is_flexible_time) : 'Horaire flexible'}
            </Badge>
            <Badge variant="outline" className="text-orange-700 border-orange-300">
              {getRecurrenceText(post.recurrence)}
            </Badge>
          </div>

          {post.description && (
            <p className="text-gray-700 text-sm line-clamp-3">
              {post.description}
            </p>
          )}

          {!isOwner && (
            <Button
              onClick={() => setShowMessageModal(true)}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
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

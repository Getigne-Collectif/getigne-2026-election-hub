import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Edit, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const isOwner = user?.id === post.user_id;

  useEffect(() => {
    fetchUserProfile();
  }, [post.user_id]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', post.user_id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

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

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getUserDisplayName = (firstName: string, lastName: string) => {
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Utilisateur';
  };

  return (
    <>
      <Card className="border-blue-200 hover:shadow-md transition-shadow w-full">
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

        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userProfile?.avatar_url} />
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {userProfile ? getUserInitials(userProfile.first_name, userProfile.last_name) : '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {userProfile ? getUserDisplayName(userProfile.first_name, userProfile.last_name) : 'Chargement...'}
              </p>
              <p className="text-xs text-gray-600">
                {post.type === 'offer' ? 'Propose un trajet' : 'Cherche un covoiturage'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              <Calendar size={12} className="mr-1" />
              {post.date ? formatDate(post.date) : 'Date non définie'}
            </Badge>
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              <Clock size={12} className="mr-1" />
              {post.time_start ? formatTime(post.time_start, post.time_end, post.is_flexible_time) : 'Horaire flexible'}
            </Badge>
            {post.available_seats && (
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                <Users size={12} className="mr-1" />
                {post.available_seats} place{post.available_seats > 1 ? 's' : ''}
              </Badge>
            )}
            {getRecurrenceText(post.recurrence, post.date) && (
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                {getRecurrenceText(post.recurrence, post.date)}
              </Badge>
            )}
          </div>

          {post.description && (
            <div className="space-y-2">
              <div className="text-gray-700 text-sm">
                {isExpanded ? (
                  <p className="whitespace-pre-wrap">{post.description}</p>
                ) : (
                  <p className="line-clamp-2">{post.description}</p>
                )}
              </div>
              {post.description.length > 100 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                >
                  {isExpanded ? (
                    <>
                      Réduire <ChevronUp size={16} className="ml-1" />
                    </>
                  ) : (
                    <>
                      Voir plus <ChevronDown size={16} className="ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
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

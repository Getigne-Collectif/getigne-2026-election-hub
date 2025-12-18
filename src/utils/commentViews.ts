import { supabase } from '@/integrations/supabase/client';
import { ResourceType } from '@/types/comments.types';

/**
 * Marque un commentaire comme vu par un utilisateur
 */
export async function markCommentAsViewed(
  commentId: string,
  commentType: ResourceType,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('comment_views')
      .insert({
        comment_id: commentId,
        user_id: userId,
        comment_type: commentType,
      })
      .select()
      .single();

    // Ignorer l'erreur si c'est une violation de contrainte unique (déjà vu)
    if (error && error.code !== '23505') {
      console.error('Error marking comment as viewed:', error);
    }
  } catch (error) {
    console.error('Error marking comment as viewed:', error);
  }
}

/**
 * Marque plusieurs commentaires comme vus en batch
 */
export async function markCommentsAsViewed(
  commentIds: string[],
  commentType: ResourceType,
  userId: string
): Promise<void> {
  if (commentIds.length === 0) return;

  try {
    // Récupérer les commentaires déjà vus pour éviter les doublons
    const { data: existingViews } = await supabase
      .from('comment_views')
      .select('comment_id')
      .eq('user_id', userId)
      .eq('comment_type', commentType)
      .in('comment_id', commentIds);

    const existingIds = new Set(existingViews?.map(v => v.comment_id) || []);
    const newIds = commentIds.filter(id => !existingIds.has(id));

    if (newIds.length === 0) return;

    // Insérer les nouveaux en batch
    const viewsToInsert = newIds.map(commentId => ({
      comment_id: commentId,
      user_id: userId,
      comment_type: commentType,
    }));

    const { error } = await supabase
      .from('comment_views')
      .insert(viewsToInsert);

    if (error) {
      console.error('Error marking comments as viewed:', error);
    }
  } catch (error) {
    console.error('Error marking comments as viewed:', error);
  }
}

/**
 * Récupère les IDs des commentaires vus par un utilisateur pour une ressource donnée
 */
export async function getViewedCommentIds(
  commentIds: string[],
  commentType: ResourceType,
  userId: string
): Promise<Set<string>> {
  if (commentIds.length === 0) return new Set();

  try {
    const { data, error } = await supabase
      .from('comment_views')
      .select('comment_id')
      .eq('user_id', userId)
      .eq('comment_type', commentType)
      .in('comment_id', commentIds);

    if (error) {
      console.error('Error fetching viewed comment IDs:', error);
      return new Set();
    }

    return new Set(data?.map(v => v.comment_id) || []);
  } catch (error) {
    console.error('Error fetching viewed comment IDs:', error);
    return new Set();
  }
}

/**
 * Compte le nombre de commentaires non vus pour une ressource
 */
export async function getUnreadCommentCount(
  resourceId: string,
  resourceType: ResourceType,
  userId: string,
  programPointId?: string,
  flagshipProjectId?: string
): Promise<number> {
  try {
    let query;

    if (resourceType === 'news') {
      // Pour les commentaires de news
      query = supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('news_id', resourceId)
        .eq('status', 'approved');
    } else {
      // Pour les commentaires de programme
      query = supabase
        .from('program_comments')
        .select('id', { count: 'exact', head: true });

      if (flagshipProjectId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (query as any) = query.eq('flagship_project_id', flagshipProjectId);
      } else if (programPointId) {
        query = query.eq('program_point_id', programPointId);
      } else if (resourceId) {
        query = query.eq('program_item_id', resourceId).is('program_point_id', null);
      }

      query = query.eq('status', 'approved');
    }

    // Récupérer le total de commentaires approuvés
    const { count: totalCount, error: countError } = await query;

    if (countError || !totalCount || totalCount === 0) {
      return 0;
    }

    // Récupérer tous les IDs de commentaires pour cette ressource (en excluant ceux de l'utilisateur)
    let idsQuery;
    if (resourceType === 'news') {
      const { data: commentsData } = await supabase
        .from('comments')
        .select('id, user_id')
        .eq('news_id', resourceId)
        .eq('status', 'approved')
        .neq('user_id', userId); // Exclure les commentaires de l'utilisateur

      if (!commentsData || commentsData.length === 0) return 0;

      const commentIds = commentsData.map(c => c.id);
      const viewedIds = await getViewedCommentIds(commentIds, 'news', userId);
      return commentIds.length - viewedIds.size;
    } else {
      // Pour les commentaires de programme
      let programQuery = supabase
        .from('program_comments')
        .select('id, user_id');

      if (flagshipProjectId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (programQuery as any) = programQuery.eq('flagship_project_id', flagshipProjectId);
      } else if (programPointId) {
        programQuery = programQuery.eq('program_point_id', programPointId);
      } else if (resourceId) {
        programQuery = programQuery.eq('program_item_id', resourceId).is('program_point_id', null);
      }

      programQuery = programQuery
        .eq('status', 'approved')
        .neq('user_id', userId); // Exclure les commentaires de l'utilisateur

      const { data: commentsData } = await programQuery;

      if (!commentsData || commentsData.length === 0) return 0;

      const commentIds = commentsData.map(c => c.id);
      const viewedIds = await getViewedCommentIds(commentIds, 'program', userId);
      return commentIds.length - viewedIds.size;
    }
  } catch (error) {
    console.error('Error getting unread comment count:', error);
    return 0;
  }
}


import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/auth';
import { markCommentAsViewed, markCommentsAsViewed, getViewedCommentIds } from '@/utils/commentViews';
import { Comment, ResourceType } from '@/types/comments.types';

interface UseCommentViewsOptions {
  comments: Comment[];
  resourceType: ResourceType;
  isSectionOpen: boolean;
}

/**
 * Hook personnalisé pour gérer le suivi de lecture des commentaires
 */
export function useCommentViews({
  comments,
  resourceType,
  isSectionOpen,
}: UseCommentViewsOptions) {
  const { user } = useAuth();
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction récursive pour obtenir tous les IDs de commentaires (y compris les réponses)
  const getAllCommentIds = useCallback((commentsList: Comment[]): string[] => {
    const ids: string[] = [];
    const traverse = (comment: Comment) => {
      ids.push(comment.id);
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.forEach(traverse);
      }
    };
    commentsList.forEach(traverse);
    return ids;
  }, []);

  // Récupérer les IDs des commentaires déjà vus au chargement
  useEffect(() => {
    if (!user || comments.length === 0) {
      setViewedIds(new Set());
      return;
    }

    const fetchViewedIds = async () => {
      const commentIds = getAllCommentIds(comments);
      const viewed = await getViewedCommentIds(commentIds, resourceType, user.id);
      setViewedIds(viewed);
    };

    fetchViewedIds();
  }, [user, comments, resourceType, getAllCommentIds]);

  // Marquer un commentaire comme vu
  const markAsViewed = useCallback(
    async (commentId: string) => {
      if (!user) {
        return;
      }

      // Vérifier si déjà vu et ajouter immédiatement à l'état local
      setViewedIds(prev => {
        if (prev.has(commentId)) {
          return prev;
        }
        return new Set(prev).add(commentId);
      });

      // Ajouter à la liste des IDs en attente pour le batch
      setPendingIds(prev => new Set(prev).add(commentId));

      // Annuler le timer précédent
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Débouncer le marquage en batch
      debounceTimerRef.current = setTimeout(async () => {
        setPendingIds(currentPending => {
          const idsToMark = Array.from(currentPending);
          if (idsToMark.length > 0 && user) {
            markCommentsAsViewed(idsToMark, resourceType, user.id);
          }
          return new Set();
        });
      }, 500);
    },
    [user, resourceType]
  );

  // Marquer plusieurs commentaires comme vus
  const markMultipleAsViewed = useCallback(
    async (commentIds: string[]) => {
      if (!user || commentIds.length === 0) return;

      // Filtrer les IDs non vus en utilisant l'état actuel
      let newIds: string[] = [];
      setViewedIds(prev => {
        newIds = commentIds.filter(id => !prev.has(id));
        if (newIds.length === 0) return prev;

        // Retourner l'état mis à jour
        const updated = new Set(prev);
        newIds.forEach(id => updated.add(id));
        return updated;
      });

      // Marquer en batch après la mise à jour de l'état
      if (newIds.length > 0) {
        await markCommentsAsViewed(newIds, resourceType, user.id);
      }
    },
    [user, resourceType]
  );

  // Marquer tous les commentaires visibles comme vus (quand la section s'ouvre)
  const markAllVisibleAsViewed = useCallback(async () => {
    if (!user || !isSectionOpen || comments.length === 0) return;

    const allIds = getAllCommentIds(comments);
    await markMultipleAsViewed(allIds);
  }, [user, isSectionOpen, comments, markMultipleAsViewed]);

  // Nettoyer le timer au démontage
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Marquer tous les commentaires comme vus quand la section s'ouvre
  useEffect(() => {
    if (isSectionOpen && user) {
      // Petit délai pour laisser le temps aux commentaires de se charger
      const timer = setTimeout(() => {
        markAllVisibleAsViewed();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isSectionOpen, user, markAllVisibleAsViewed]);

  return {
    viewedIds,
    markAsViewed,
    markMultipleAsViewed,
    markAllVisibleAsViewed,
    isViewed: (commentId: string) => viewedIds.has(commentId),
  };
}


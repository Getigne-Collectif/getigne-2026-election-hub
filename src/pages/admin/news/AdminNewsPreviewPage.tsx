import React from 'react';
import { useParams } from 'react-router-dom';
import NewsDetailPage from '@/pages/NewsDetailPage';

/**
 * Page d'aperçu des articles en brouillon pour les administrateurs
 * Cette route est protégée et permet de voir les brouillons même après un refresh
 */
const AdminNewsPreviewPage = () => {
  const { slug } = useParams<{ slug: string }>();
  
  // On réutilise NewsDetailPage qui gère déjà l'affichage des brouillons pour les admins
  // La différence est que cette route est protégée par AdminRoute dans App.tsx
  return <NewsDetailPage />;
};

export default AdminNewsPreviewPage;


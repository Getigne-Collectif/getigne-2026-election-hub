
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { generateRoutes } from '@/routes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NewsCardProps {
  article: {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    image: string;
    tags?: string[];
    news_to_tags?: Array<{
      news_tags: {
        name: string;
      };
    }>;
    slug?: string;
    author?: {
      first_name?: string;
      last_name?: string;
      avatar_url?: string | null;
    } | null;
  };
  index?: number;
}

export const NewsCard = ({ article, index = 0 }: NewsCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  // Déterminer l'URL de l'article - utiliser le slug s'il existe, sinon utiliser l'ID
  const articleUrl = article.slug 
    ? generateRoutes.newsDetail(article.slug)
    : generateRoutes.newsDetail(article.id);
    
  // Format de l'auteur
  const authorName = article.author 
    ? `${article.author.first_name || ''} ${article.author.last_name || ''}`.trim() 
    : '';
  
  // Initiales de l'auteur pour le fallback de l'avatar
  const getAuthorInitials = () => {
    if (!article.author) return '';
    const firstInitial = article.author.first_name?.charAt(0).toUpperCase() || '';
    const lastInitial = article.author.last_name?.charAt(0).toUpperCase() || '';
    return `${firstInitial}${lastInitial}`.trim() || 'A';
  };

  return (
    <Link to={articleUrl} className="block h-full">
      <article 
        ref={ref}
        className={`bg-white rounded-xl overflow-hidden shadow-sm border border-brand-100 hover-lift h-full ${
          isVisible 
            ? 'opacity-100 translate-y-0 transition-all duration-700 ease-out' 
            : 'opacity-0 translate-y-10'
        }`}
        style={{ transitionDelay: `${index * 100}ms` }}
      >
        <div className="relative h-48 overflow-hidden">
          <img 
            src={article.image} 
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
        <div className="p-6">
          <div className="flex items-center text-brand-500 text-sm mb-3 gap-3">
            <div className="flex items-center">
              <Calendar size={14} className="mr-1" />
              <time>{new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
            </div>
            {authorName && (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  {article.author?.avatar_url && (
                    <AvatarImage src={article.author.avatar_url} alt={authorName} />
                  )}
                  <AvatarFallback className="text-xs">{getAuthorInitials()}</AvatarFallback>
                </Avatar>
                <span>{authorName}</span>
              </div>
            )}
          </div>
          <h3 className="font-medium text-xl mb-2">{article.title}</h3>
          <p
            className="text-brand-700 mb-4 line-clamp-2"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxHeight: '180px', // ~3 lines for most font-sizes
            }}
            title={article.excerpt}
          >
            {article.excerpt}
          </p>
          <div className="text-brand flex items-center text-sm font-medium group">
            Lire la suite
            <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  );
};

export default NewsCard;

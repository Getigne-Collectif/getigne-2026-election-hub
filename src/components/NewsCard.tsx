
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, User } from 'lucide-react';
import { generateRoutes } from '@/routes';

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

  return (
    <Link to={articleUrl} className="block h-full">
      <article 
        ref={ref}
        className={`bg-white rounded-xl overflow-hidden shadow-sm border border-getigne-100 hover-lift h-full ${
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
          <div className="flex items-center text-getigne-500 text-sm mb-3 gap-3">
            <div className="flex items-center">
              <Calendar size={14} className="mr-1" />
              <time>{new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
            </div>
            {authorName && (
              <div className="flex items-center">
                <User size={14} className="mr-1" />
                <span>{authorName}</span>
              </div>
            )}
          </div>
          <h3 className="font-medium text-xl mb-2">{article.title}</h3>
          <p className="text-getigne-700 mb-4">{article.excerpt}</p>
          <div className="text-getigne-accent flex items-center text-sm font-medium group">
            Lire la suite
            <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  );
};

export default NewsCard;

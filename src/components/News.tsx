import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/use-toast';
import { Routes, generateRoutes } from '@/routes';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 3;

const NewsCard = ({ article, index }) => {
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

  const articleUrl = article.slug 
    ? generateRoutes.newsDetail(article.slug)
    : generateRoutes.newsDetail(article.id);

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
          <div className="flex items-center text-brand-500 text-sm mb-3">
            <Calendar size={14} className="mr-1" />
            <time>{new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
          </div>
          <h3 className="font-medium text-xl mb-2">{article.title}</h3>
          <div className="text-brand flex items-center text-sm font-medium group">
            Lire la suite
            <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  );
};

const News = ({ limit, showPagination = false }) => {
  const [newsArticles, setNewsArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + (limit || ITEMS_PER_PAGE) - 1;
        
        const { count, error: countError } = await supabase
          .from('news')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published');
          
        if (countError) {
          console.error('Error fetching count:', countError);
        } else {
          setTotalCount(count || 0);
        }
        
        const { data, error } = await supabase
          .from('news')
          .select(`
            *,
            author:profiles(first_name, last_name)
          `)
          .eq('status', 'published')
          .order('date', { ascending: false })
          .range(from, to);
        
        if (error) {
          console.error('Error fetching news:', error);
          throw error;
        }
        
        setNewsArticles(data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération des actualités:', err);
        setError(err.message || "Impossible de récupérer les actualités.");
        
        toast({
          title: "Erreur de chargement",
          description: "Impossible de récupérer les actualités. Veuillez rafraîchir la page.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [currentPage, limit]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <section id="actualites" className="py-12 px-4 bg-brand-50">
        <div className="container mx-auto">
          <div className="text-center">Chargement des actualités...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="actualites" className="py-12 px-4 bg-brand-50">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="bg-brand/10 text-brand font-medium px-4 py-1 rounded-full text-sm">
              Actualités
            </span>
            <h2 className="text-4xl font-bold mt-4 mb-6">Dernières nouvelles du collectif</h2>
            <p className="text-brand-700 text-lg">
              Suivez l'actualité de notre collectif, nos rencontres, et nos réflexions pour construire ensemble l'avenir de Gétigné.
            </p>
          </div>
          <div className="text-center">
            <p className="text-red-500 mb-4">Nous n'avons pas pu charger les dernières actualités.</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-brand text-brand-fg rounded-md hover:bg-brand/90"
            >
              Réessayer
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (newsArticles.length === 0) {
    return (
      <section id="actualites" className="py-24 px-4 bg-brand-50">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="bg-brand/10 text-brand font-medium px-4 py-1 rounded-full text-sm">
              Actualités
            </span>
            <h2 className="text-4xl font-bold mt-4 mb-6">Dernières nouvelles du collectif</h2>
            <p className="text-brand-700 text-lg">
              Suivez l'actualité de notre collectif, nos rencontres, et nos réflexions pour construire ensemble l'avenir de Gétigné.
            </p>
          </div>
          <div className="text-center">
            <p className="mb-4">Aucune actualité disponible pour le moment.</p>
            <Button 
              asChild
              className="bg-brand text-brand-fg rounded-md hover:bg-brand/90"
            >
              <Link to={Routes.NEWS}>
                Voir toutes nos actualités
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const paginationItems = [];
  const maxVisiblePages = 5;

  if (totalPages > 1) {
    if (currentPage > 1) {
      paginationItems.push(
        <PaginationItem key="prev">
          <PaginationPrevious 
            onClick={() => handlePageChange(currentPage - 1)}
            className="cursor-pointer" 
          />
        </PaginationItem>
      );
    }
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
      paginationItems.push(
        <PaginationItem key="start">
          <PaginationLink 
            onClick={() => handlePageChange(1)}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      if (startPage > 2) {
        paginationItems.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      paginationItems.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={i === currentPage}
            onClick={() => handlePageChange(i)}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationItems.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      paginationItems.push(
        <PaginationItem key="end">
          <PaginationLink 
            onClick={() => handlePageChange(totalPages)}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    if (currentPage < totalPages) {
      paginationItems.push(
        <PaginationItem key="next">
          <PaginationNext 
            onClick={() => handlePageChange(currentPage + 1)}
            className="cursor-pointer" 
          />
        </PaginationItem>
      );
    }
  }

  return (
    <section id="actualites" className="py-24 px-4 bg-brand-50">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-brand/10 text-brand font-medium px-4 py-1 rounded-full text-sm">
            Actualités
          </span>
          <h2 className="text-4xl font-bold mt-4 mb-6">Dernières nouvelles du collectif</h2>
          <p className="text-brand-700 text-lg">
            Suivez l'actualité de notre collectif, nos rencontres, et nos réflexions pour construire ensemble l'avenir de Gétigné.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {newsArticles.map((article, index) => (
            <NewsCard key={article.id} article={article} index={index} />
          ))}
        </div>

        {showPagination && totalPages > 1 && (
          <div className="mt-12">
            <Pagination>
              <PaginationContent>
                {paginationItems}
              </PaginationContent>
            </Pagination>
          </div>
        )}

        <div className="mt-12 text-center">
          <Button 
            asChild
            className="bg-brand text-brand-fg rounded-md hover:bg-brand/90"
          >
            <Link to={Routes.NEWS}>
              Toutes nos actualités
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default News;


import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/use-toast';

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

  return (
    <Link to={`/actualites/${article.id}`} className="block">
      <article 
        ref={ref}
        className={`bg-white rounded-xl overflow-hidden shadow-sm border border-getigne-100 hover-lift ${
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
          <div className="flex items-center text-getigne-500 text-sm mb-3">
            <Calendar size={14} className="mr-1" />
            <time>{new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
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

const News = () => {
  const [newsArticles, setNewsArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        console.log('Fetching news articles...');
        
        // Utiliser la requête anonyme pour la page d'accueil (uniquement news publiées)
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .eq('status', 'published')  // Assurer que seuls les articles publiés sont affichés
          .order('date', { ascending: false })
          .limit(3);
        
        if (error) {
          console.error('Error fetching news:', error);
          throw error;
        }
        
        console.log('Fetched news articles:', data);
        setNewsArticles(data);
        setError(null);
      } catch (error) {
        console.error('Erreur lors de la récupération des actualités:', error);
        
        // Si nous n'avons pas dépassé le nombre maximal de tentatives, réessayer
        if (retryCount < maxRetries) {
          console.log(`Tentative ${retryCount + 1}/${maxRetries}...`);
          setRetryCount(retryCount + 1);
          // Attendre un peu avant de réessayer (avec un délai exponentiel)
          setTimeout(() => {
            setLoading(true); // Réactiver l'indicateur de chargement
          }, 1000 * Math.pow(2, retryCount));
        } else {
          setError(error.message || "Impossible de récupérer les actualités après plusieurs tentatives.");
          // Afficher une notification d'erreur
          toast({
            title: "Erreur de chargement",
            description: "Impossible de récupérer les actualités. Veuillez rafraîchir la page.",
            variant: "destructive"
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      fetchNews();
    }
  }, [loading, retryCount]);

  if (loading) {
    return (
      <section id="actualites" className="py-24 px-4 bg-getigne-50">
        <div className="container mx-auto">
          <div className="text-center">Chargement des actualités...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="actualites" className="py-24 px-4 bg-getigne-50">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
              Actualités
            </span>
            <h2 className="text-4xl font-bold mt-4 mb-6">Dernières nouvelles du collectif</h2>
            <p className="text-getigne-700 text-lg">
              Suivez l'actualité de notre collectif, nos rencontres, et nos réflexions pour construire ensemble l'avenir de Gétigné.
            </p>
          </div>
          <div className="text-center">
            <p className="text-red-500 mb-4">Nous n'avons pas pu charger les dernières actualités.</p>
            <Button 
              onClick={() => {setLoading(true); setRetryCount(0);}}
              className="bg-getigne-accent text-white rounded-md hover:bg-getigne-accent/90"
            >
              Réessayer
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Traiter le cas où la requête a réussi mais n'a retourné aucun résultat
  if (newsArticles.length === 0) {
    return (
      <section id="actualites" className="py-24 px-4 bg-getigne-50">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
              Actualités
            </span>
            <h2 className="text-4xl font-bold mt-4 mb-6">Dernières nouvelles du collectif</h2>
            <p className="text-getigne-700 text-lg">
              Suivez l'actualité de notre collectif, nos rencontres, et nos réflexions pour construire ensemble l'avenir de Gétigné.
            </p>
          </div>
          <div className="text-center">
            <p className="mb-4">Aucune actualité disponible pour le moment.</p>
            <Button 
              asChild
              className="bg-getigne-accent text-white rounded-md hover:bg-getigne-accent/90"
            >
              <Link to="/actualites">
                Voir toutes nos actualités
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="actualites" className="py-24 px-4 bg-getigne-50">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
            Actualités
          </span>
          <h2 className="text-4xl font-bold mt-4 mb-6">Dernières nouvelles du collectif</h2>
          <p className="text-getigne-700 text-lg">
            Suivez l'actualité de notre collectif, nos rencontres, et nos réflexions pour construire ensemble l'avenir de Gétigné.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {newsArticles.map((article, index) => (
            <NewsCard key={article.id} article={article} index={index} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button 
            asChild
            className="bg-getigne-accent text-white rounded-md hover:bg-getigne-accent/90"
          >
            <Link to="/actualites">
              Toutes nos actualités
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default News;


import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Dummy news data
const newsArticles = [
  {
    id: 1,
    title: "Lancement officiel de notre collectif",
    excerpt: "Nous sommes fiers d'annoncer le lancement officiel de Gétigné Collectif, une initiative citoyenne pour les élections municipales de 2026.",
    date: "24 avril 2024",
    image: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    title: "Consultation citoyenne sur les transports",
    excerpt: "Rejoignez-nous pour notre première consultation citoyenne autour des enjeux de mobilité dans notre commune.",
    date: "15 avril 2024",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    title: "Rencontre avec les associations locales",
    excerpt: "Notre collectif a rencontré plusieurs associations locales pour échanger sur les besoins en matière d'équipements et de soutien.",
    date: "2 avril 2024",
    image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  }
];

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
          <time>{article.date}</time>
        </div>
        <h3 className="font-medium text-xl mb-2">{article.title}</h3>
        <p className="text-getigne-700 mb-4">{article.excerpt}</p>
        <Link 
          to={`/actualites/${article.id}`} 
          className="text-getigne-accent flex items-center text-sm font-medium group"
        >
          Lire la suite
          <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
};

const News = () => {
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

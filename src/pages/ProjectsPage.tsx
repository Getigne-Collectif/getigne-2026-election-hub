import { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Calendar, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import ProjectProposalModal from '@/components/ProjectProposalModal';
import { Project } from '@/types/projects.types';

const ProjectsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  
  // Fetch projects from Supabase
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects-page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching projects:", error);
        return [];
      }
      
      return (data as any) as Project[];
    }
  });

  // Filter active projects
  const activeProjects = projects.filter(p => p.status === 'active');
  const featuredProjects = projects.filter(p => p.is_featured === true);

  return (
    <HelmetProvider>
      <Helmet>
        <title>Nos projets | Gétigné Collectif</title>
        <meta
          name="description"
          content="Découvrez nos projets concrets pour Gétigné : potager collectif, plateforme d'entraide, lieu de partage et fabrication."
        />
      </Helmet>

      <div className="page-content">
        <Navbar />
        
        <div className="pt-24 bg-getigne-50">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                Initiatives locales
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Nos projets</h1>
              <p className="text-getigne-700 text-lg">
                Des initiatives concrètes pour une commune plus solidaire, écologique et participative. 
                Découvrez nos projets et rejoignez-nous !
              </p>
            </div>

            {/* Projets actuels */}
            <div className="space-y-16 mb-16">
              {isLoading ? (
                <div className="text-center py-12">Chargement des projets...</div>
              ) : activeProjects.length === 0 ? (
                <div className="text-center py-12 text-getigne-700">Aucun projet actif pour le moment.</div>
              ) : (
                activeProjects.map((project, index) => (
                  <div key={project.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="grid md:grid-cols-2">
                      <div className={`order-2 md:order-${index % 2 === 0 ? '1' : '2'} p-8 md:p-12 flex flex-col justify-center`}>
                        <h2 className="text-3xl font-bold mb-6 text-getigne-900">{project.title}</h2>
                        <p className="text-getigne-700 mb-6">
                          {project.description}
                        </p>
                        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          {project.contact_email && (
                            <div className="flex items-center gap-2 text-getigne-700">
                              <Mail className="h-5 w-5 text-getigne-accent" />
                              <span>Contact : {project.contact_email}</span>
                            </div>
                          )}
                          
                          {project.url && (
                            <Button className="bg-getigne-accent hover:bg-getigne-accent/90" asChild>
                              <a href={project.url} target="_blank" rel="noopener noreferrer">
                                En savoir plus
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className={`order-1 md:order-${index % 2 === 0 ? '2' : '1'} h-64 md:h-auto bg-getigne-100`}>
                        {project.image ? (
                          <img
                            src={project.image}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-getigne-100">
                            <span className="text-getigne-400">Image non disponible</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {/* Fallback for when Supabase doesn't have data yet */}
              {!isLoading && activeProjects.length === 0 && (
                <>
                  {/* Potager collectif */}
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="grid md:grid-cols-2">
                      <div className="order-2 md:order-1 p-8 md:p-12 flex flex-col justify-center">
                        <h2 className="text-3xl font-bold mb-6 text-getigne-900">Potager collectif</h2>
                        <p className="text-getigne-700 mb-6">
                          Un projet lancé en 2023 en lien avec l'association du Moulin Neuf, La Solid' et Ok Compost'. 
                          L'objectif est de créer un potager collectif sur une parcelle mise à disposition par le Moulin Neuf.
                        </p>
                        <p className="text-getigne-700 mb-6">
                          C'est l'opportunité pour la quinzaine de membres qui s'y retrouvent régulièrement d'apprendre 
                          ensemble des concepts de permaculture dans une ambiance conviviale et très agréable.
                        </p>
                        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="flex items-center gap-2 text-getigne-700">
                            <Mail className="h-5 w-5 text-getigne-accent" />
                            <span>Contact : leny.bernard@getigne-collectif.fr</span>
                          </div>
                        </div>
                      </div>
                      <div className="order-1 md:order-2 h-64 md:h-auto bg-getigne-100">
                        <img
                          src="/lovable-uploads/potager-collectif.jpg"
                          alt="Potager collectif du Moulin Neuf"
                          className="w-full h-full object-cover"
                        />
                        <p className="text-xs text-getigne-500 italic p-2 text-right">
                          Photo: Annie Spratt via Unsplash
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Communo */}
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="grid md:grid-cols-2">
                      <div className="order-1 h-64 md:h-auto bg-getigne-100">
                        <img
                          src="/lovable-uploads/communo.jpg"
                          alt="Plateforme d'entraide Communo"
                          className="w-full h-full object-cover"
                        />
                        <p className="text-xs text-getigne-500 italic p-2">
                          Photo: Brooke Cagle via Unsplash
                        </p>
                      </div>
                      <div className="order-2 p-8 md:p-12 flex flex-col justify-center">
                        <h2 className="text-3xl font-bold mb-6 text-getigne-900">Communo</h2>
                        <p className="text-getigne-700 mb-6">
                          Une plateforme numérique de mutualisation de matériel et d'entraide. 
                          Le but est double : créer du lien social autour des valeurs d'entraide et de solidarité 
                          tout en réduisant notre pression sur l'environnement.
                        </p>
                        <p className="text-getigne-700 mb-6">
                          En évitant les achats inutiles grâce au prêt ou à la location de matériel au sein 
                          de nos communautés, nous agissons concrètement. C'est un projet open source, 
                          ouvert à tous, et qui a vocation à s'étendre au-delà de Gétigné.
                        </p>
                        <div className="mt-6">
                          <Button className="bg-getigne-accent hover:bg-getigne-accent/90" asChild>
                            <a href="https://communo.app" target="_blank" rel="noopener noreferrer">
                              Découvrir Communo
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Projets en cours de développement */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-10">Projets en développement</h2>
              
              <div className="bg-white rounded-xl shadow-md p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="order-2 md:order-1">
                    <h3 className="text-2xl font-bold mb-4 text-getigne-900">Tiers-lieu collaboratif</h3>
                    <p className="text-getigne-700 mb-4">
                      Nous travaillons sur la création d'un lieu polyvalent qui réunira trois fonctions essentielles pour notre commune :
                    </p>
                    <ul className="space-y-4 mb-6">
                      <li className="flex items-start">
                        <div className="bg-getigne-accent/10 p-2 rounded-full mr-3 flex-shrink-0">
                          <Calendar className="h-5 w-5 text-getigne-accent" />
                        </div>
                        <div>
                          <span className="font-semibold">Bibliothèque d'objets</span>
                          <p className="text-getigne-700 text-sm mt-1">
                            Un système de prêt pour les objets d'usage occasionnel, réduisant ainsi la consommation excessive.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-getigne-accent/10 p-2 rounded-full mr-3 flex-shrink-0">
                          <Wrench className="h-5 w-5 text-getigne-accent" />
                        </div>
                        <div>
                          <span className="font-semibold">Repair café</span>
                          <p className="text-getigne-700 text-sm mt-1">
                            Un espace où les habitants peuvent apprendre à réparer leurs objets avec l'aide de bénévoles.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-getigne-accent/10 p-2 rounded-full mr-3 flex-shrink-0">
                          <svg className="h-5 w-5 text-getigne-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-semibold">Fablab</span>
                          <p className="text-getigne-700 text-sm mt-1">
                            Un laboratoire de fabrication avec des outils partagés pour encourager la créativité et l'innovation locale.
                          </p>
                        </div>
                      </li>
                    </ul>
                    <p className="text-getigne-700">
                      Ce projet est en phase de conception. Nous recherchons actuellement un local adapté 
                      et des partenaires pour nous accompagner dans cette démarche. Si vous souhaitez 
                      contribuer ou en savoir plus, n'hésitez pas à nous contacter !
                    </p>
                  </div>
                  <div className="order-1 md:order-2">
                    <div className="overflow-hidden rounded-lg">
                      <img
                        src="/lovable-uploads/tiers-lieu.jpg"
                        alt="Tiers-lieu collaboratif en projet"
                        className="w-full h-full object-cover"
                      />
                      <p className="text-xs text-getigne-500 italic p-2 text-right">
                        Photo: Shridhar Gupta via Unsplash
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Appel à l'action */}
            <div className="bg-getigne-accent/5 rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Vous avez une idée de projet pour Gétigné ?</h2>
              <p className="text-getigne-700 mb-6 max-w-2xl mx-auto">
                Nous sommes ouverts à toutes les initiatives qui contribuent à rendre notre commune 
                plus vivante, plus solidaire et plus durable. Partagez vos idées avec nous !
              </p>
              <Button onClick={() => setProposalModalOpen(true)}>
                Proposer un projet
              </Button>
            </div>
          </div>
        </div>

        <Footer />
        
        {/* Project proposal modal */}
        <ProjectProposalModal 
          open={proposalModalOpen}
          onOpenChange={setProposalModalOpen}
        />
      </div>
    </HelmetProvider>
  );
};

export default ProjectsPage;

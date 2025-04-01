
import { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import ProjectProposalModal from '@/components/ProjectProposalModal';
import ProjectCard from '@/components/projects/ProjectCard';
import type { Project, ProjectWithLikes } from '@/types/projects.types';

const ProjectsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [proposalModalOpen, setProposalModalOpen] = useState(false);

  // Fetch projects from Supabase
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects-page'],
    queryFn: async () => {
      // D'abord, récupérer tous les projets
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('title', { ascending: true });
        
      if (error) {
        console.error("Error fetching projects:", error);
        return [];
      }
      
      // Ensuite, récupérer le nombre de likes pour chaque projet
      const projectsWithLikes: ProjectWithLikes[] = [];
      
      for (const project of projectsData || []) {
        const { data: likesCount, error: likesError } = await supabase
          .rpc('count_project_likes', { project_id: project.id });
          
        if (likesError) {
          console.error("Error fetching likes count:", likesError);
        }
        
        projectsWithLikes.push({
          ...project,
          likes_count: likesCount || 0
        });
      }
      
      return projectsWithLikes;
    }
  });

  // Séparer les projets actifs et en développement
  const activeProjects = projects.filter(p => p.status === 'active' && p.development_status === 'active');
  const developmentProjects = projects.filter(p => p.status === 'active' && p.development_status === 'development');

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
              <h2 className="text-3xl font-bold text-center mb-10">Projets actifs</h2>
              
              {isLoading ? (
                <div className="text-center py-12">Chargement des projets...</div>
              ) : activeProjects.length === 0 ? (
                <div className="text-center py-12 text-getigne-700">Aucun projet actif pour le moment.</div>
              ) : (
                activeProjects.map((project, index) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    index={index}
                    initialLikesCount={project.likes_count}
                  />
                ))
              )}
            </div>

            {/* Projets en cours de développement */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-10">Projets en développement</h2>
              
              {isLoading ? (
                <div className="text-center py-12">Chargement des projets...</div>
              ) : developmentProjects.length === 0 ? (
                <div className="text-center py-12 text-getigne-700">Aucun projet en développement pour le moment.</div>
              ) : (
                <div className="space-y-16">
                  {developmentProjects.map((project, index) => (
                    <ProjectCard 
                      key={project.id} 
                      project={project} 
                      index={index}
                      initialLikesCount={project.likes_count}
                    />
                  ))}
                </div>
              )}
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

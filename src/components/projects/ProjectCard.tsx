
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProjectLikeButton from './ProjectLikeButton';
import type { Project } from '@/types/projects.types';

interface ProjectCardProps {
  project: Project;
  index: number;
  initialLikesCount?: number;
}

const ProjectCard = ({ project, index, initialLikesCount = 0 }: ProjectCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="grid md:grid-cols-2">
        <div className={`order-2 md:order-${index % 2 === 0 ? '1' : '2'} p-8 md:p-12 flex flex-col justify-between`}>
          <div>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-3xl font-bold text-getigne-900">{project.title}</h2>
              <ProjectLikeButton projectId={project.id} initialLikesCount={initialLikesCount} />
            </div>
            <p className="text-getigne-700 mb-6">
              {project.description}
            </p>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
  );
};

export default ProjectCard;

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserPlusIcon, CalendarCheck, PlusCircle, LayoutList, Component, Heart, Calendar } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useAuth } from '@/context/auth';
import { Routes } from '@/routes';
import { usePostHog } from '@/hooks/usePostHog';

const Campaign = () => {
  const { settings } = useAppSettings();
  const { isAdmin, userRoles } = useAuth();
  const { capture } = usePostHog();
  const HELLOASSO_JOIN_URL = import.meta.env.VITE_HELLOASSO_JOIN_URL as string;
  
  // Détermine si l'utilisateur peut accéder au programme
  const canAccessProgram = 
    settings.showProgram || 
    userRoles.includes('admin') || 
    userRoles.includes('program_manager');

  const handleHelloAssoClick = () => {
    // Track HelloAsso click in PostHog
    capture('helloasso_join_click', {
      source: 'campaign_page',
      url: HELLOASSO_JOIN_URL,
      timestamp: new Date().toISOString()
    });
  };
  
  return (
    <section id="campaign" className="py-24 px-4 bg-white">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
            Élections municipales 2026
          </span>
          <h2 className="text-4xl font-bold mt-4 mb-6">Objectif 2026</h2>
          <p className="text-getigne-700 text-lg">
            Tous engagés pour construire l'avenir de Gétigné !<br/>rejoignez notre campagne pour les élections municipales de 2026.
          </p>
        </div>

        <div className="bg-getigne-50 rounded-2xl p-8 md:p-12 mb-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-6">Participez à une campagne collective</h3>
              <p className="text-getigne-700 mb-6">
                Depuis mai 2024, nos 6 élus et l'ensemble des membres du collectif travaillent à l'élaboration d'un projet et d'un programme pour les élections municipales.
                La démarche est positive et collaborative, chaque personne volontaire peut apporter sa pierre à l'édifice afin d'offrir un autre projet à notre commune.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-getigne-accent/10 p-2 rounded-full mt-1">
                    <CalendarCheck size={18} className="text-getigne-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium">Le programme est en cours de construction</h4>
                    <p className="text-sm text-getigne-700">Nos commissions thématiques travaillent activement à l'élaboration des propositions.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-getigne-accent/10 p-2 rounded-full mt-1">
                    <UserPlusIcon size={18} className="text-getigne-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium">L'équipe est ouverte, hétérogène et accueillante</h4>
                    <p className="text-sm text-getigne-700">Chacun peut rejoindre le collectif et participer selon ses disponibilités et compétences.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-getigne-accent/10 p-2 rounded-full mt-1">
                    <Calendar size={18} className="text-getigne-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium">Nous organisons des événements réguliers</h4>
                    <p className="text-sm text-getigne-700">Des rencontres, ateliers et événements pour échanger avec les habitants de Gétigné.</p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button asChild>
                  <Link to={Routes.PROGRAM}> Découvrez notre projet pour 2026</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-64 md:h-96 rounded-xl overflow-hidden">
              <img 
                src="/images/GC-group1.jpg" 
                alt="Quelques membres du collectif" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-getigne-900/50 to-transparent pointer-events-none"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <a href={Routes.CONTACT} rel="noopener noreferrer">
                  <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg inline-block font-medium text-getigne-900">
                    Faites partie de l'aventure collective !
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-getigne-100 hover-lift">
            <h3 className="text-xl font-semibold mb-3 text-center flex items-center justify-center gap-2">
              <Heart size={18} className="text-getigne-accent" /> Soutenez le collectif
            </h3>
            <p className="text-getigne-700 mb-4">
              Adhérez ou faites un don pour financer la campagne.
            </p>
            <Button asChild variant="outline" className="w-full">
              <a href={HELLOASSO_JOIN_URL} target="_blank" rel="noopener noreferrer" onClick={handleHelloAssoClick}>Adhérer ou faire un don</a>
            </Button>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-getigne-100 hover-lift">
            <h3 className="text-xl font-semibold mb-3 text-center flex items-center justify-center gap-2">
              <Component size={18} className="text-getigne-accent" /> Rejoignez une commission
            </h3>
            <p className="text-getigne-700 mb-4">
              Intégrez l'une de nos commissions de travail selon vos centres d'intérêt et compétences.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to={Routes.COMMITTEES}>Découvrir</Link>
            </Button>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-getigne-100 hover-lift">
            <h3 className="text-xl font-semibold mb-3 text-center flex items-center justify-center gap-2">
              <CalendarCheck size={18} className="text-getigne-accent" /> Participez à nos événements
            </h3>
            <p className="text-getigne-700 mb-4">
              Consultez l'agenda de nos prochaines rencontres et événements à Gétigné.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to={Routes.AGENDA}>Agenda</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Campaign;

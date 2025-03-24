
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserPlusIcon, CalendarCheck, PlusCircle } from 'lucide-react';

const Campaign = () => {
  return (
    <section id="campaign" className="py-24 px-4 bg-white">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
            Élections municipales 2026
          </span>
          <h2 className="text-4xl font-bold mt-4 mb-6">Objectif 2026</h2>
          <p className="text-getigne-700 text-lg">
            Engagés ensemble pour construire l'avenir de Gétigné : rejoignez notre campagne pour les élections municipales de 2026.
          </p>
        </div>

        <div className="bg-getigne-50 rounded-2xl p-8 md:p-12 mb-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-6">Une campagne collective</h3>
              <p className="text-getigne-700 mb-6">
                Depuis mai 2024, nous travaillons à l'élaboration de notre programme pour les élections municipales. 
                Une démarche collaborative où chaque citoyen peut apporter sa pierre à l'édifice.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-getigne-accent/10 p-2 rounded-full mt-1">
                    <CalendarCheck size={18} className="text-getigne-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium">Programme en construction</h4>
                    <p className="text-sm text-getigne-700">Nos commissions thématiques travaillent activement à l'élaboration des propositions.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-getigne-accent/10 p-2 rounded-full mt-1">
                    <UserPlusIcon size={18} className="text-getigne-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium">Équipe ouverte</h4>
                    <p className="text-sm text-getigne-700">Chacun peut rejoindre le collectif et participer selon ses disponibilités et compétences.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-getigne-accent/10 p-2 rounded-full mt-1">
                    <PlusCircle size={18} className="text-getigne-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium">Événements réguliers</h4>
                    <p className="text-sm text-getigne-700">Des rencontres, ateliers et événements pour échanger avec les habitants de Gétigné.</p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button asChild>
                  <Link to="/objectif-2026">En savoir plus</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-64 md:h-96 rounded-xl overflow-hidden">
              <img 
                src="/placeholder.svg" 
                alt="Gétigné Collectif en campagne" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-getigne-900/50 to-transparent pointer-events-none"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg inline-block">
                  <p className="font-medium text-getigne-900">Rejoignez-nous pour préparer 2026 !</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-getigne-100 hover-lift">
            <h3 className="text-xl font-semibold mb-3">Adhérer au collectif</h3>
            <p className="text-getigne-700 mb-4">
              Devenez membre du Gétigné Collectif et participez activement à notre projet pour 2026.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/adherer">Rejoindre</Link>
            </Button>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-getigne-100 hover-lift">
            <h3 className="text-xl font-semibold mb-3">Commissions thématiques</h3>
            <p className="text-getigne-700 mb-4">
              Intégrez l'une de nos commissions de travail selon vos centres d'intérêt et compétences.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/objectif-2026/commissions">Découvrir</Link>
            </Button>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-getigne-100 hover-lift">
            <h3 className="text-xl font-semibold mb-3">Prochains événements</h3>
            <p className="text-getigne-700 mb-4">
              Consultez l'agenda de nos prochaines rencontres et événements à Gétigné.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/agenda">Agenda</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Campaign;

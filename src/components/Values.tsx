
import { LightbulbIcon, UsersIcon, HeartIcon, VoteIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Values = () => {
  return (
    <section id="values" className="py-24 px-4 bg-getigne-50">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
            Notre identité
          </span>
          <h2 className="text-4xl font-bold mt-4 mb-6">
            Notre collectif, nos valeurs
          </h2>
          <p className="text-getigne-700 text-lg">
            Découvrez ce qui nous rassemble et nous motive à agir ensemble pour notre commune.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div className="bg-white rounded-xl shadow-sm p-8 animate-fade-up">
            <div className="w-12 h-12 bg-getigne-accent/10 rounded-full flex items-center justify-center mb-4">
              <LightbulbIcon className="text-getigne-accent h-6 w-6" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Notre ADN</h3>
            <p className="text-getigne-700 mb-6">
              Notre collectif est né d'une volonté citoyenne de s'engager pour le bien commun. Nous sommes des habitants de Gétigné, animés par l'envie de faire de notre commune un lieu où il fait bon vivre, ensemble et durablement.
            </p>
            <p className="text-getigne-700">
              Nous croyons en une politique locale transparente, collaborative et tournée vers l'avenir, qui place les citoyens au cœur des décisions qui impactent leur quotidien.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="w-12 h-12 bg-getigne-accent/10 rounded-full flex items-center justify-center mb-4">
              <HeartIcon className="text-getigne-accent h-6 w-6" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Nos valeurs fondamentales</h3>
            <ul className="space-y-4 text-getigne-700 list-disc pl-5">
              <li><span className="font-medium">Solidarité :</span> Faire communauté en prenant soin des plus vulnérables</li>
              <li><span className="font-medium">Écologie :</span> Préserver notre environnement pour les générations futures</li>
              <li><span className="font-medium">Transparence :</span> Informer clairement et être à l'écoute des citoyens</li>
              <li><span className="font-medium">Innovation :</span> Oser expérimenter de nouvelles solutions</li>
              <li><span className="font-medium">Respect :</span> Accueillir la diversité des opinions dans le dialogue</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-white rounded-xl shadow-sm p-8 animate-fade-up" style={{ animationDelay: "400ms" }}>
            <div className="w-12 h-12 bg-getigne-accent/10 rounded-full flex items-center justify-center mb-4">
              <UsersIcon className="text-getigne-accent h-6 w-6" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Notre statut associatif</h3>
            <p className="text-getigne-700 mb-4">
              Notre collectif est organisé en association loi 1901, ce qui nous permet d'agir de manière indépendante et structurée. Nous fonctionnons grâce à l'engagement bénévole de nos membres et aux cotisations qui financent nos actions.
            </p>
            <p className="text-getigne-700 mb-4">
              Le bureau de l'association coordonne les activités et s'assure que nos initiatives s'inscrivent dans les valeurs que nous défendons.
            </p>
            <div className="mt-6">
              <Button 
                asChild
                className="bg-getigne-accent hover:bg-getigne-accent/90 text-white"
              >
                <Link to="/adherer">Rejoignez-nous</Link>
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 animate-fade-up" style={{ animationDelay: "600ms" }}>
            <div className="w-12 h-12 bg-getigne-accent/10 rounded-full flex items-center justify-center mb-4">
              <VoteIcon className="text-getigne-accent h-6 w-6" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Démocratie participative</h3>
            <p className="text-getigne-700 mb-6">
              Nous croyons profondément que les citoyens doivent être impliqués dans les décisions qui façonnent leur quotidien. C'est pourquoi nous avons mis en place des commissions citoyennes ouvertes à tous.
            </p>
            <p className="text-getigne-700 mb-4">
              Ces espaces de dialogue permettent à chacun d'apporter ses idées, ses compétences et son énergie pour construire ensemble des projets concrets pour notre commune.
            </p>
            <div className="mt-6">
              <Button 
                asChild
                variant="outline"
                className="border-getigne-accent text-getigne-accent hover:bg-getigne-accent/5"
              >
                <Link to="/commissions">Découvrir les commissions</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Values;

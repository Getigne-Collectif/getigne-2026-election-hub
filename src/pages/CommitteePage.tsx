
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CommitteeMembers from '@/components/CommitteeMembers';
import CommitteeWorkModal from '@/components/CommitteeWorkModal';
import CommitteeContactForm from '@/components/CommitteeContactForm';
import { type Tables } from '@/integrations/supabase/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import { Lightbulb, Bike, Utensils, Music, Leaf, Users } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  role: string;
  photo: string;
}

interface Committee {
  id: string;
  title: string;
  description: string;
  icon: string;
}

// Map pour les icônes - corrigé pour utiliser les bons noms
const iconMap = {
  'Lightbulb': Lightbulb,
  'Bicycle': Bike,
  'Utensils': Utensils,
  'Music': Music,
  'Leaf': Leaf
};

// Map pour les couleurs des thèmes
const colorMap = {
  'Lightbulb': {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    border: 'border-yellow-200',
    hover: 'hover:bg-yellow-100/50',
    accent: 'bg-yellow-400/10',
    theme: 'Énergie',
    coverImage: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80',
    teamImage: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80'
  },
  'Bicycle': {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    hover: 'hover:bg-purple-100/50',
    accent: 'bg-purple-400/10',
    theme: 'Mobilité',
    coverImage: 'https://images.unsplash.com/photo-1519583272095-6433daf26b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2796&q=80',
    teamImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80'
  },
  'Utensils': {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    hover: 'hover:bg-orange-100/50',
    accent: 'bg-orange-400/10',
    theme: 'Alimentation',
    coverImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2974&q=80',
    teamImage: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80'
  },
  'Music': {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-100/50',
    accent: 'bg-blue-400/10',
    theme: 'Culture',
    coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80',
    teamImage: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80'
  },
  'Leaf': {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    hover: 'hover:bg-green-100/50',
    accent: 'bg-green-400/10',
    theme: 'Biodiversité',
    coverImage: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2971&q=80',
    teamImage: 'https://images.unsplash.com/photo-1582213782179-e0d4d3cce817?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80'
  }
};

// Textes enrichis pour les descriptions des commissions
const extendedDescriptions = {
  'Lightbulb': `
    La commission Énergie travaille sur les questions de transition énergétique et d'efficacité énergétique 
    au niveau communal. Nous étudions les moyens de développer les énergies renouvelables à Gétigné, 
    de réduire la consommation énergétique des bâtiments publics et d'accompagner les habitants dans leurs 
    projets de rénovation énergétique. Nous travaillons également sur la question de l'éclairage public et 
    de la lutte contre la pollution lumineuse.
  `,
  'Bicycle': `
    La commission Mobilité réfléchit aux moyens d'améliorer les déplacements dans notre commune, en favorisant 
    les mobilités douces et en réduisant la place de la voiture. Nous travaillons sur le développement des 
    pistes cyclables, la sécurisation des cheminements piétons, l'amélioration des transports en commun et 
    la mise en place de solutions innovantes comme le covoiturage local ou l'autopartage.
  `,
  'Utensils': `
    La commission Alimentation s'intéresse à la question de l'autonomie alimentaire locale, au développement 
    des circuits courts et à l'amélioration de la qualité des repas dans la restauration collective (école, EHPAD). 
    Nous travaillons sur des projets de jardins partagés, de marchés de producteurs locaux et d'éducation à 
    l'alimentation durable. Notre objectif est de promouvoir une alimentation saine, locale et respectueuse 
    de l'environnement.
  `,
  'Music': `
    La commission Culture travaille sur l'offre culturelle de notre commune, afin de la rendre plus riche, 
    diversifiée et accessible à tous. Nous réfléchissons à la valorisation du patrimoine local, à l'amélioration 
    des équipements culturels et à la mise en place d'événements fédérateurs. Nous voulons faire de Gétigné 
    une commune où la culture est vivante et partagée par le plus grand nombre.
  `,
  'Leaf': `
    La commission Biodiversité se concentre sur la préservation et la valorisation de notre environnement naturel. 
    Nous travaillons sur la végétalisation des espaces publics, la gestion différenciée des espaces verts, 
    la préservation des zones humides et la sensibilisation des habitants à la richesse de notre biodiversité locale. 
    Nous portons également des projets de création de corridors écologiques et de protection des espèces locales.
  `
};

const CommitteePage = () => {
  const { id } = useParams();
  const [selectedWork, setSelectedWork] = useState<Tables<'committee_works'> | null>(null);
  const [teamPhotoUrl, setTeamPhotoUrl] = useState<string | null>(null);

  const membersQuery = useQuery({
    queryKey: ['committee', id, 'members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_members')
        .select('*')
        .eq('committee_id', id);

      if (error) {
        throw new Error(error.message);
      }

      return data as Member[];
    },
  });

  const worksQuery = useQuery({
    queryKey: ['committee', id, 'works'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_works')
        .select('*')
        .eq('committee_id', id)
        .order('date', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as Tables<'committee_works'>[];
    },
  });

  const committeeQuery = useQuery({
    queryKey: ['committee', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citizen_committees')
        .select('*')
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return data as Committee[];
    },
  });

  // Vérifier si des photos d'équipe sont disponibles
  useEffect(() => {
    // Simuler une vérification d'image d'équipe
    // Dans une vraie implémentation, récupérer depuis Supabase
    const checkTeamPhoto = async () => {
      try {
        // Ici on pourrait vérifier si une photo d'équipe existe dans Supabase Storage
        // Pour l'exemple, utilisons une condition aléatoire
        const hasCustomPhoto = Math.random() > 0.5;
        
        if (!hasCustomPhoto) {
          // Pas de photo personnalisée, on garde celle par défaut
          setTeamPhotoUrl(null);
        } else {
          // Photo personnalisée trouvée (factice pour cet exemple)
          setTeamPhotoUrl("https://images.unsplash.com/photo-1582213782179-e0d4d3cce817?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2970&q=80");
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de la photo d'équipe:", error);
        setTeamPhotoUrl(null);
      }
    };
    
    checkTeamPhoto();
  }, [id]);

  const works = worksQuery.data || [];
  const committee = committeeQuery.data?.[0];

  if (!committee) {
    return (
      <>
        <Navbar />
        <Breadcrumb />
        <div className="container py-8 mt-20">
          <div className="flex items-center justify-center h-64">
            <p className="text-xl text-getigne-700">Commission non trouvée</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const themeColor = colorMap[committee.icon] || {
    bg: 'bg-getigne-50',
    text: 'text-getigne-accent',
    border: 'border-getigne-100',
    hover: 'hover:bg-getigne-100/50',
    accent: 'bg-getigne-accent/10',
    theme: 'Thématique',
    coverImage: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?ixlib=rb-4.0.3&auto=format&fit=crop&w=2971&q=80',
    teamImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&auto=format&fit=crop&w=2970&q=80'
  };

  const IconComponent = iconMap[committee.icon] || Leaf;
  const extendedDescription = extendedDescriptions[committee.icon] || committee.description;

  // On utilise la photo d'équipe personnalisée si elle existe, sinon celle du thème
  const teamImage = teamPhotoUrl || themeColor.teamImage;

  return (
    <>
      <Navbar />
      <Breadcrumb />
      
      {/* Cover image */}
      <div 
        className="h-64 md:h-80 w-full bg-cover bg-center relative" 
        style={{ backgroundImage: `url(${themeColor.coverImage})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        <div className="container mx-auto h-full flex items-end pb-8 relative z-10">
          <div className={`${themeColor.bg} p-3 rounded-full inline-flex items-center justify-center`}>
            <IconComponent className={themeColor.text} size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white ml-4">
            {committee.title}
          </h1>
        </div>
      </div>
      
      <div className="container py-8 space-y-8">
        {/* Theme badge */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-sm ${themeColor.text} ${themeColor.bg} px-3 py-1 rounded-full`}>
            {themeColor.theme}
          </span>
        </div>

        {/* Description */}
        <div className="bg-white shadow-sm rounded-xl p-6 border border-getigne-100">
          <h2 className="text-2xl font-bold mb-4">À propos de cette commission</h2>
          <div className="flex flex-col md:flex-row md:gap-8">
            <div className="md:flex-1">
              <p className="text-getigne-700 whitespace-pre-line mb-6">
                {extendedDescription}
              </p>
              
              {/* Membres simplifiés */}
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-3">Pilote de la commission</h3>
                {id && <CommitteeMembers committeeId={id} simplified={true} />}
              </div>
            </div>
            
            {/* Team photo */}
            <div className="mt-6 md:mt-0 md:w-1/3">
              <div className="rounded-xl overflow-hidden shadow-md">
                <img 
                  src={teamImage}
                  alt="Équipe de la commission"
                  className="w-full h-48 md:h-64 object-cover"
                />
              </div>
              <p className="text-center text-sm text-getigne-700 mt-2 italic">
                Les membres de la commission {committee.title} lors d'une réunion de travail
              </p>
            </div>
          </div>
        </div>

        {/* Works */}
        <div className="bg-white shadow-sm rounded-xl p-6 border border-getigne-100">
          <h2 className="text-2xl font-bold mb-6">Travaux de la commission</h2>
          <div className="grid gap-6">
            {works.length === 0 && (
              <p className="text-getigne-700">
                Aucun travail n'a encore été publié par cette commission.
              </p>
            )}
            
            {works.map((work) => (
              <div
                key={work.id}
                className={`p-6 rounded-lg border ${themeColor.border} cursor-pointer ${themeColor.hover} transition-colors`}
                onClick={() => setSelectedWork(work)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{work.title}</h3>
                  <span className="text-sm text-muted-foreground">
                    {new Date(work.date).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <p className="mt-2 text-muted-foreground line-clamp-2">
                  {work.content}
                </p>
                
                {/* Preview of attachments */}
                <div className="mt-4 flex gap-4">
                  {(work.images as any[])?.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {(work.images as any[]).length} image(s)
                    </span>
                  )}
                  {(work.files as any[])?.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {(work.files as any[]).length} document(s)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form Section */}
        {committee && (
          <CommitteeContactForm 
            committeeId={committee.id}
            committeeName={committee.title}
            themeColor={themeColor}
          />
        )}

        <CommitteeWorkModal
          work={selectedWork}
          open={!!selectedWork}
          onOpenChange={(open) => !open && setSelectedWork(null)}
        />
      </div>
      <Footer />
    </>
  );
};

export default CommitteePage;

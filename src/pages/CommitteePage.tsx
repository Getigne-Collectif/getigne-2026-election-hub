import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase, Committee } from '@/integrations/supabase/client';
import CommitteeMembers from '@/components/CommitteeMembers';
import CommitteeWorkModal from '@/components/CommitteeWorkModal';
import CommitteeContactForm from '@/components/CommitteeContactForm';
import { type Tables } from '@/integrations/supabase/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Lightbulb, Bike, Utensils, Music, Leaf, Users, FileText, Calendar, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Member {
  id: string;
  name: string;
  role: string;
  photo: string;
}

const iconMap = {
  'users': Users,
  'lightbulb': Lightbulb,
  'bike': Bike,
  'bicycle': Bike,
  'utensils': Utensils,
  'music': Music,
  'leaf': Leaf
};

// Fonctions utilitaires pour les couleurs
const getIconComponent = (iconName: string) => {
  const key = iconName ? iconName.toLowerCase() : 'users';
  return iconMap[key] || Users;
};

const getColorTheme = (colorClass: string | null) => {
  // Valeurs par défaut au cas où la couleur n'est pas définie
  const defaultTheme = {
    bg: 'bg-getigne-50',
    text: 'text-getigne-accent',
    border: 'border-getigne-100',
    hover: 'hover:bg-getigne-100/50',
    accent: 'bg-getigne-accent/10',
    theme: 'Thématique',
    defaultCoverImage: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=2971&q=80',
    defaultTeamImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2970&q=80'
  };

  // Si pas de couleur spécifiée, retourner les valeurs par défaut
  if (!colorClass) return defaultTheme;

  // Extraire la couleur de base de la classe Tailwind (bg-COLOR-500)
  const colorMatch = colorClass.match(/bg-([a-z]+)-\d+/);
  if (!colorMatch || !colorMatch[1]) return defaultTheme;

  const color = colorMatch[1];
  
  // Mapper les couleurs avec leurs thèmes
  const mapping = {
    'green': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Environnement',
      defaultCoverImage: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=2971&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1582213782179-e0d4d3cce817?auto=format&fit=crop&w=2970&q=80'
    },
    'blue': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Général',
      defaultCoverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=2970&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=2970&q=80'
    },
    'yellow': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Énergie',
      defaultCoverImage: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=2970&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=2970&q=80'
    },
    'purple': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Mobilité',
      defaultCoverImage: 'https://images.unsplash.com/photo-1519583272095-6433daf26b6e?auto=format&fit=crop&w=2796&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2970&q=80'
    },
    'red': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Urgence',
      defaultCoverImage: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=2971&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2970&q=80'
    },
    'orange': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Alimentation',
      defaultCoverImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2974&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=2970&q=80'
    },
    'indigo': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Culture',
      defaultCoverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=2970&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=2970&q=80'
    },
    'pink': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Social',
      defaultCoverImage: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=2971&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2970&q=80'
    },
    'cyan': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Eau',
      defaultCoverImage: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=2971&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2970&q=80'
    },
    'teal': {
      bg: `bg-${color}-50`,
      text: `text-${color}-600`,
      border: `border-${color}-200`,
      hover: `hover:bg-${color}-100/50`,
      accent: `bg-${color}-400/10`,
      theme: 'Biodiversité',
      defaultCoverImage: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=2971&q=80',
      defaultTeamImage: 'https://images.unsplash.com/photo-1582213782179-e0d4d3cce817?auto=format&fit=crop&w=2970&q=80'
    }
  };

  return mapping[color] || defaultTheme;
};

const CommitteePage = () => {
  const { id } = useParams();
  const [selectedWork, setSelectedWork] = useState<Tables<'committee_works'> | null>(null);
  const [teamPhotoUrl, setTeamPhotoUrl] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [otherCommittees, setOtherCommittees] = useState<any[]>([]);
  const [currentCommitteeIndex, setCurrentCommitteeIndex] = useState<number>(-1);
  const [isCommitteeMember, setIsCommitteeMember] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Vérifier si l'utilisateur actuel est membre de la commission
  useEffect(() => {
    const checkCommitteeMembership = async () => {
      try {
        // Récupérer l'utilisateur actuel
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsCommitteeMember(false);
          return;
        }
        
        setCurrentUserId(user.id);
        
        // Vérifier s'il est membre de la commission
        if (id && user) {
          const { data, error } = await supabase.rpc(
            'is_committee_member', 
            { user_id: user.id, committee_id: id }
          );
          
          if (error) throw error;
          
          setIsCommitteeMember(!!data);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'appartenance à la commission:", error);
        setIsCommitteeMember(false);
      }
    };
    
    checkCommitteeMembership();
  }, [id]);

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

  const allCommitteesQuery = useQuery({
    queryKey: ['all_committees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citizen_committees')
        .select('*')
        .order('title');

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });

  const isLoading = membersQuery.isLoading || worksQuery.isLoading || committeeQuery.isLoading || allCommitteesQuery.isLoading;

  useEffect(() => {
    const fetchCommitteeImages = async () => {
      try {
        if (id) {
          const { data: committeeData, error } = await supabase
            .from('citizen_committees')
            .select('team_photo_url, cover_photo_url')
            .eq('id', id)
            .single();

          if (error) {
            console.error("Error fetching committee images:", error);
            return;
          }

          // Définir l'image d'équipe
          if (committeeData?.team_photo_url) {
            setTeamPhotoUrl(committeeData.team_photo_url);
          }
          
          // Définir l'image de couverture
          if (committeeData?.cover_photo_url) {
            setCoverPhotoUrl(committeeData.cover_photo_url);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des images de la commission:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading && committeeQuery.data) {
      fetchCommitteeImages();
    }
  }, [id, committeeQuery.data, isLoading]);

  useEffect(() => {
    if (allCommitteesQuery.data && id) {
      const committees = allCommitteesQuery.data;
      setOtherCommittees(committees);

      const currentIndex = committees.findIndex((c) => c.id === id);
      setCurrentCommitteeIndex(currentIndex);
    }
  }, [allCommitteesQuery.data, id]);

  const works = worksQuery.data || [];
  const committee = committeeQuery.data?.[0];

  const getPrevCommittee = () => {
    if (currentCommitteeIndex <= 0 || otherCommittees.length === 0) return null;
    return otherCommittees[currentCommitteeIndex - 1];
  };

  const getNextCommittee = () => {
    if (currentCommitteeIndex === -1 || currentCommitteeIndex >= otherCommittees.length - 1) return null;
    return otherCommittees[currentCommitteeIndex + 1];
  };

  const prevCommittee = getPrevCommittee();
  const nextCommittee = getNextCommittee();

  if (loading || isLoading) {
    return (
      <>
        <Navbar />
        <div className="container py-8 mt-20">
          <div className="flex items-center justify-center h-64">
            <p className="text-xl text-getigne-700">Chargement des informations de la commission...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!committee) {
    return (
      <>
        <Navbar />
        <div className="container py-8 mt-20">
          <div className="flex items-center justify-center h-64">
            <p className="text-xl text-getigne-700">Commission non trouvée</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const themeColor = getColorTheme(committee.color);
  const IconComponent = getIconComponent(committee.icon);

  // Utiliser la photo de couverture depuis la DB ou la valeur par défaut
  const coverImage = coverPhotoUrl || themeColor.defaultCoverImage;
  
  // Utiliser la photo d'équipe depuis la DB ou la valeur par défaut
  const teamImage = teamPhotoUrl || themeColor.defaultTeamImage;

  return (
    <>
      <Navbar />

      <div
        className="h-64 md:h-80 w-full bg-cover bg-center relative"
        style={{ backgroundImage: `url(${coverImage})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="container mx-auto h-full flex items-center relative z-10">
          <div className="text-white">
            <div className={`${themeColor.bg} p-3 rounded-full inline-flex items-center justify-center mb-4`}>
              <IconComponent className={themeColor.text} size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Commission {committee.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        <div className="pt-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">
                  <Home className="h-4 w-4 mr-1" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/objectif-2026">Objectif 2026</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/commissions">Commissions citoyennes</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{committee.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`text-sm ${themeColor.text} ${themeColor.bg} px-3 py-1 rounded-full`}>
            {themeColor.theme}
          </span>
        </div>

        <div className="bg-white shadow-sm rounded-xl p-6 border border-getigne-100">
          <h2 className="text-2xl font-bold mb-4">À propos de cette commission</h2>
          <div className="flex flex-col md:flex-row md:gap-8">
            <div className="md:flex-1">
              <p className="text-getigne-700 whitespace-pre-line mb-6">
                {committee.description}
              </p>

              <div className="mt-4">
                <h3 className="text-lg font-medium mb-3">Pilote de la commission</h3>
                {id && <CommitteeMembers committeeId={id} simplified={true} />}
              </div>
            </div>

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

        <div className="bg-white shadow-sm rounded-xl p-6 border border-getigne-100">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">Travaux de la commission</h2>
              <p className="text-getigne-700">
                Retrouvez ci-dessous les comptes-rendus, études et propositions réalisés par la commission {committee.title}.
                Ces travaux constituent la base de notre réflexion pour élaborer des propositions concrètes pour Gétigné.
              </p>
            </div>
            
            {isCommitteeMember && (
              <Button 
                className={`${themeColor.bg} ${themeColor.text} border ${themeColor.border} hover:${themeColor.hover}`}
                asChild
              >
                <Link to={`/admin/committees/works/${committee.id}`}>
                  Gérer les travaux
                </Link>
              </Button>
            )}
          </div>

          {works.length === 0 ? (
            <div className={`p-6 rounded-lg ${themeColor.bg} border ${themeColor.border}`}>
              <div className="flex items-center">
                <FileText className={`${themeColor.text} mr-3`} size={24} />
                <p className="text-getigne-700">
                  Aucun travail n'a encore été publié par cette commission. Les premières publications arriveront prochainement !
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {works.map((work) => (
                <div
                  key={work.id}
                  className={`p-6 rounded-lg border ${themeColor.border} cursor-pointer ${themeColor.hover} transition-colors`}
                  onClick={() => setSelectedWork(work)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className={`${themeColor.text}`} size={20} />
                    <h3 className="text-lg font-semibold">{work.title}</h3>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-sm text-getigne-500">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      <span>
                        {new Date(work.date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      <span>
                        {new Date(work.date).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-getigne-700 mb-4">
                    {work.content.length > 160 ? `${work.content.substring(0, 160)}...` : work.content}
                  </p>

                  <div className="flex flex-wrap gap-4">
                    {Array.isArray(work.images) && work.images.length > 0 && (
                      <span className={`text-sm ${themeColor.text} ${themeColor.bg} px-3 py-1 rounded-full`}>
                        {work.images.length} image{work.images.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {Array.isArray(work.files) && work.files.length > 0 && (
                      <span className={`text-sm ${themeColor.text} ${themeColor.bg} px-3 py-1 rounded-full`}>
                        {work.files.length} document{work.files.length > 1 ? 's' : ''}
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className={`ml-auto border-${themeColor.border}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWork(work);
                      }}
                    >
                      Voir les détails
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {committee && (
          <CommitteeContactForm
            committeeId={committee.id}
            committeeName={committee.title}
            themeColor={themeColor}
          />
        )}

        <div className="">
          <h2 className="text-xl font-bold mb-4">Découvrir les autres commissions
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-auto">
              {prevCommittee ? (
                <Link
                  to={`/commissions/${prevCommittee.id}`}
                  className="flex items-center hover:underline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span>Commission {prevCommittee.title}</span>
                </Link>
              ) : (
                <span className="text-getigne-500 flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-2 opacity-50" />
                  <span>Première commission</span>
                </span>
              )}
            </div>



            <div className="w-full md:w-auto text-right">
              {nextCommittee ? (
                <Link
                  to={`/commissions/${nextCommittee.id}`}
                  className="flex items-center justify-end hover:underline"
                >
                  <span>Commission {nextCommittee.title}</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              ) : (
                <span className="text-getigne-500 flex items-center justify-end">
                  <span>Dernière commission</span>
                  <ArrowRight className="h-4 w-4 ml-2 opacity-50" />
                </span>
              )}
            </div>
          </div>
        </div>

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


import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase, Committee } from '@/integrations/supabase/client';
import CommitteeMembers from '@/components/CommitteeMembers';
import CommitteeWorkModal from '@/components/CommitteeWorkModal';
import CommitteeContactForm from '@/components/CommitteeContactForm';
import { type Tables } from '@/integrations/supabase/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Routes, generateRoutes } from '@/routes';
import {
  Lightbulb,
  Bike,
  Utensils,
  Music,
  Leaf,
  Users,
  FileText,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Pencil, Trash, Plus
} from 'lucide-react';
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
import {toast} from "sonner";
import CitizenCommittees, { getColorTheme } from '@/components/CitizenCommittees';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useAuth } from '@/context/AuthContext';

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

// Fonctions utilitaires pour les icônes
const getIconComponent = (iconName: string) => {
  const key = iconName ? iconName.toLowerCase() : 'users';
  return iconMap[key] || Users;
};

const CommitteePage = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedWork, setSelectedWork] = useState<Tables<'committee_works'> | null>(null);
  const [teamPhotoUrl, setTeamPhotoUrl] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [otherCommittees, setOtherCommittees] = useState<Committee[]>([]);
  const [currentCommitteeIndex, setCurrentCommitteeIndex] = useState<number>(-1);
  const [isCommitteeMember, setIsCommitteeMember] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view');
  const [works, setWorks] = useState<Tables<'committee_works'>[]>([]);
  const { settings } = useAppSettings();
  const { userRoles } = useAuth();
  const canSeeWorks = settings.showCommitteeWorks || isCommitteeMember || userRoles.includes('program_manager');
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
    enabled: Boolean(id),
  });

  // Fetch committee works
  const fetchCommitteeWorks = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
          .from('committee_works')
          .select('*')
          .eq('committee_id', id)
          .order('date', { ascending: false });

      if (error) throw error;
      setWorks(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des comptes-rendus:', error);
      toast.error("Impossible de charger les comptes-rendus");
    }
  }, [id]);

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
    enabled: Boolean(id),
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

  const isLoading = membersQuery.isLoading || committeeQuery.isLoading || allCommitteesQuery.isLoading;

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

          // Safely check and set the image URLs
          if (committeeData) {
            console.log("Committee images retrieved:", committeeData);

            // Set team photo if available
            if (committeeData.team_photo_url) {
              setTeamPhotoUrl(committeeData.team_photo_url);
              console.log("Set team photo URL to:", committeeData.team_photo_url);
            }

            // Set cover photo if available
            if (committeeData.cover_photo_url) {
              setCoverPhotoUrl(committeeData.cover_photo_url);
              console.log("Set cover photo URL to:", committeeData.cover_photo_url);
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des images de la commission:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!id) {
      setLoading(false);
    } else if (!isLoading && committeeQuery.data) {
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

  const committee = committeeQuery.data?.[0];
  useEffect(() => {
    if (committee) {
      fetchCommitteeWorks();
    }
  }, [committee, fetchCommitteeWorks]);

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

  // Si aucune id n'est fournie, on affiche la liste des commissions
  if (!id) {
    return (
      <>
        <Navbar />
        <div className="container py-8 mt-20 space-y-8">
          
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
            Démocratie participative
          </span>
          <h2 className="text-4xl font-bold mt-4 mb-6">Nos commissions citoyennes</h2>
          <p className="text-getigne-700 text-lg">
            Depuis mai 2024, des commissions citoyennes travaillent en lien avec nos élus sur des thématiques essentielles pour l'avenir de notre commune.
          </p>
        </div>
          <CitizenCommittees />
        </div>
        <Footer />
      </>
    );
  }

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

  // Utiliser la photo de couverture depuis la DB et faire un logging pour debug
  console.log("Cover photo URL from DB:", committee.cover_photo_url);
  console.log("Cover photo URL from state:", coverPhotoUrl);
  console.log("Theme default cover image:", themeColor.defaultCoverImage);

  const coverImage = committee.cover_photo_url || themeColor.defaultCoverImage;
  console.log("Final cover image used:", coverImage);

  // Utiliser la photo d'équipe depuis la DB ou la valeur par défaut
  const teamImage = committee.team_photo_url || themeColor.defaultTeamImage;

  const handleOpenShowModal = (work: Tables<'committee_works'> | null) => {
    setSelectedWork(work);
    setMode('view');
  };

  const handleOpenNewModal = () => {
    setSelectedWork(null);
    setMode('create');
  };

  const handleOpenEditModal = (work: Tables<'committee_works'> | null) => {
    setSelectedWork(work);
    setMode('edit');
  };

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
                <BreadcrumbLink href={Routes.COMMITTEES}>Commissions</BreadcrumbLink>
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

        <div className={`bg-white shadow-sm rounded-xl p-6 border ${themeColor.border}`}>
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <IconComponent className={`${themeColor.text} mr-2`} size={22} />
            <span>À propos de cette commission</span>
          </h2>
          <div className="flex flex-col md:flex-row md:gap-8">
            <div className="md:flex-1">
              <p className="text-getigne-700 whitespace-pre-line mb-6">
                {committee.description}
              </p>

              <div className="mt-4">
                {id && <CommitteeMembers committeeId={id} simplified={true} />}
              </div>
            </div>

            <div className="mt-6 md:mt-0 md:w-1/3">
              <div className={`rounded-xl overflow-hidden shadow-md border ${themeColor.border}`}>
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

        {canSeeWorks && (
        <div className={`bg-white shadow-sm rounded-xl p-6 border ${themeColor.border}`}>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <FileText className={`${themeColor.text} mr-2`} size={22} />
                <span>Travaux de la commission</span>
              </h2>
              <p className="text-getigne-700">
                Retrouvez ci-dessous les comptes-rendus, études et propositions réalisés par la commission {committee.title}.
                Ces travaux constituent la base de notre réflexion pour élaborer des propositions concrètes pour Gétigné.
              </p>
            </div>

            {isCommitteeMember && (
              <Button variant="outline" onClick={() => handleOpenNewModal()} className={`border-${themeColor.border} ${themeColor.text}`}>
                <Plus className="mr-1" />
                <span>Nouveau</span>
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
                  onClick={() => handleOpenShowModal(work)}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="flex items-center gap-2">
                      <FileText className={`${themeColor.text}`} size={20} />
                      <h3 className="text-lg font-semibold">{work.title}</h3>
                    </span>
                    <div>
                      {isCommitteeMember && (
                        <Button
                            variant="outline"
                            size="sm"
                            className={`border-${themeColor.border}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(work);
                            }}
                        >
                          <Pencil className={`h-4 w-4 mr-1 ${themeColor.text}`} />
                          <span>Modifier</span>
                        </Button>
                      )}
                    </div>
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
                      className={`ml-auto border-${themeColor.border} ${themeColor.text}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenShowModal(work);
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
        )}

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
                  to={generateRoutes.committeeDetail(prevCommittee.id)}
                  className={`flex items-center hover:underline ${themeColor.text}`}
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
                  to={generateRoutes.committeeDetail(nextCommittee.id)}
                  className={`flex items-center justify-end hover:underline ${themeColor.text}`}
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
          committeeId={id!}
          work={selectedWork}
          open={selectedWork !== null}
          onOpenChange={(open) => !open && setSelectedWork(null)}
          onSuccess={fetchCommitteeWorks}
          mode={mode}
        />
      </div>
      <Footer />
    </>
  );
};

export default CommitteePage;


import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Lightbulb, Bike, Utensils, Music, Leaf, Calendar, Users, FileDown, ExternalLink } from 'lucide-react';
import CommitteeMembers, { getMemberCount } from '@/components/CommitteeMembers';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// Types
type Work = {
  id: string;
  title: string;
  content: string;
  date: string;
  images?: { url: string; caption: string }[];
  files?: { url: string; name: string; type: string }[];
};

// Map pour les icônes
const iconMap = {
  Lightbulb,
  Bicycle: Bike, // Replace Bicycle with Bike
  Utensils,
  Music,
  Leaf
};

// Map pour les icônes de type de fichier
const fileTypeIconMap: Record<string, React.ReactNode> = {
  pdf: <FileDown className="mr-2" size={16} />,
  doc: <FileDown className="mr-2" size={16} />,
  docx: <FileDown className="mr-2" size={16} />,
  xls: <FileDown className="mr-2" size={16} />,
  xlsx: <FileDown className="mr-2" size={16} />,
  ppt: <FileDown className="mr-2" size={16} />,
  pptx: <FileDown className="mr-2" size={16} />,
  default: <ExternalLink className="mr-2" size={16} />
};

const CommitteePage = () => {
  const { id } = useParams();
  const [committee, setCommittee] = useState(null);
  const [pilots, setPilots] = useState([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchCommitteeData = async () => {
      try {
        // Récupérer les informations de la commission
        const { data: committeeData, error: committeeError } = await supabase
          .from('citizen_committees')
          .select('*')
          .eq('id', id)
          .single();
        
        if (committeeError) throw committeeError;

        // Récupérer les pilotes de la commission
        const { data: pilotsData, error: pilotsError } = await supabase
          .from('committee_members')
          .select('*')
          .eq('committee_id', id)
          .eq('role', 'pilote');

        if (pilotsError) throw pilotsError;
        
        // Récupérer les travaux de la commission
        const { data: worksData, error: worksError } = await supabase
          .from('committee_works')
          .select('*')
          .eq('committee_id', id)
          .order('date', { ascending: false });
        
        if (worksError) throw worksError;
        
        // Récupérer le nombre de membres
        const count = await getMemberCount(id);

        setCommittee(committeeData);
        setPilots(pilotsData);
        setWorks(worksData);
        setMemberCount(count);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des données de la commission:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    if (id) {
      fetchCommitteeData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-24 flex-grow">
          <div className="text-center">Chargement des informations de la commission...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !committee) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-24 flex-grow">
          <div className="text-center text-red-500">
            {error || "Cette commission n'existe pas."}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const Icon = iconMap[committee.icon] || Leaf;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 pb-12 bg-getigne-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-getigne-accent/10 rounded-lg flex items-center justify-center">
                <Icon className="text-getigne-accent" size={32} />
              </div>
              <div>
                <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                  Commission citoyenne
                </span>
                <h1 className="text-3xl md:text-4xl font-bold mt-2">{committee.title}</h1>
              </div>
            </div>
            <p className="text-getigne-700 text-lg mb-6">
              {committee.description}
            </p>

            {/* Informations sur les membres et pilotes */}
            <div className="mt-6 flex flex-wrap gap-6 items-start">
              {/* Nombre total de membres */}
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-getigne-100">
                <Users className="text-getigne-accent" size={20} />
                <span className="font-medium">{memberCount} {memberCount > 1 ? 'membres' : 'membre'}</span>
              </div>
              
              {/* Pilotes */}
              {pilots.length > 0 && (
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="text-getigne-700 font-medium">
                    {pilots.length > 1 ? 'Pilotes :' : 'Pilote :'}
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {pilots.map(pilot => (
                      <div key={pilot.id} className="flex items-center bg-white rounded-full pl-1 pr-3 py-1 shadow-sm border border-getigne-100">
                        <Avatar className="w-8 h-8 mr-2 border-2 border-getigne-accent">
                          <AvatarImage src={pilot.photo} alt={pilot.name} />
                        </Avatar>
                        <span className="font-medium text-sm">{pilot.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Committee works */}
      <main className="flex-grow py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Synthèses des travaux */}
            <section>
              <h2 className="text-2xl font-bold mb-8 flex items-center">
                <Calendar size={24} className="mr-2 text-getigne-accent" />
                Synthèses des travaux
              </h2>
              
              {works.length === 0 ? (
                <p className="text-getigne-700">
                  Aucune synthèse disponible pour le moment. Les travaux de cette commission sont en cours.
                </p>
              ) : (
                <div className="space-y-10">
                  {works.map(work => (
                    <div key={work.id} className="bg-white p-6 rounded-xl shadow-sm border border-getigne-100">
                      <div className="flex items-center text-getigne-500 text-sm mb-3">
                        <Calendar size={14} className="mr-1" />
                        <time>{format(new Date(work.date), 'd MMMM yyyy', { locale: fr })}</time>
                      </div>
                      <h3 className="text-xl font-medium mb-4">{work.title}</h3>
                      <div className="text-getigne-700 space-y-4">
                        {work.content.split('\n').slice(0, 2).map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                        {work.content.split('\n').length > 2 && (
                          <div className="text-center mt-4">
                            <Button 
                              onClick={() => setSelectedWork(work)}
                              variant="outline"
                              className="mt-2"
                            >
                              Voir plus de détails
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Participation */}
          <div className="max-w-3xl mx-auto mt-16 pt-10 border-t border-getigne-100">
            <h2 className="text-2xl font-bold mb-4">Participez à cette commission</h2>
            <p className="text-getigne-700 mb-6">
              Les commissions citoyennes sont ouvertes à tous les habitants de Gétigné qui souhaitent s'impliquer 
              dans la vie de notre commune. Aucune compétence particulière n'est requise, juste l'envie de contribuer 
              à l'amélioration de notre cadre de vie.
            </p>
            <div className="bg-getigne-accent/10 p-6 rounded-xl">
              <p className="text-getigne-900 font-medium">
                Vous souhaitez rejoindre cette commission ou obtenir plus d'informations ?
                Contactez-nous à <a href="mailto:commissions@getigne-collectif.fr" className="text-getigne-accent hover:underline">commissions@getigne-collectif.fr</a>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modal pour afficher les détails d'une synthèse */}
      <Dialog open={!!selectedWork} onOpenChange={(open) => !open && setSelectedWork(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedWork && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl md:text-2xl">{selectedWork.title}</DialogTitle>
                <DialogDescription>
                  <time className="text-getigne-500">
                    {format(new Date(selectedWork.date), 'd MMMM yyyy', { locale: fr })}
                  </time>
                </DialogDescription>
              </DialogHeader>
              
              {/* Images */}
              {selectedWork.images && selectedWork.images.length > 0 && (
                <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedWork.images.map((image, index) => (
                    <figure key={index} className="rounded-lg overflow-hidden">
                      <img 
                        src={image.url} 
                        alt={image.caption || `Image ${index + 1}`} 
                        className="w-full h-64 object-cover"
                      />
                      {image.caption && (
                        <figcaption className="text-sm text-getigne-500 p-2 bg-getigne-50">
                          {image.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}

              {/* Contenu */}
              <div className="text-getigne-700 space-y-4 my-6">
                {selectedWork.content.split('\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              {/* Fichiers à télécharger */}
              {selectedWork.files && selectedWork.files.length > 0 && (
                <>
                  <Separator />
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Documents à télécharger</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedWork.files.map((file, index) => {
                        const fileIcon = file.type ? fileTypeIconMap[file.type] : fileTypeIconMap.default;
                        return (
                          <a 
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 border border-getigne-100 rounded-lg hover:bg-getigne-50 transition-colors"
                          >
                            {fileIcon}
                            <span>{file.name}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CommitteePage;

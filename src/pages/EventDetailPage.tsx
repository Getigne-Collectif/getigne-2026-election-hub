
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {Calendar, Clock, MapPin, Users, ArrowLeft, Tag, Home} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import NotFound from './NotFound';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";

interface Event {
  id: string;
  title: string;
  description: string;
  content: string;
  date: string;
  location: string;
  image: string;
  committee?: string;
  committee_id?: string;
  is_members_only?: boolean;
}

interface Committee {
  id: string;
  title: string;
  description: string;
  icon: string;
}

// Map committee names to colors
const committeeColors = {
  "Environnement": "bg-getigne-green-500",
  "Mobilité": "bg-getigne-accent",
  "Solidarité": "bg-getigne-700",
  "Culture": "bg-[#9b87f5]",
  "Économie": "bg-[#0EA5E9]",
  "Éducation": "bg-[#F97316]",
};

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        const eventData = data as Event;
        setEvent(eventData);

        // Fetch committee information if event is associated with one
        if (eventData.committee_id) {
          const { data: committeeData, error: committeeError } = await supabase
            .from('citizen_committees')
            .select('*')
            .eq('id', eventData.committee_id)
            .single();

          if (!committeeError && committeeData) {
            setCommittee(committeeData as Committee);
          }
        }

        // Fetch related events (same committee or recent events)
        if (eventData.committee_id) {
          const { data: committeeEvents } = await supabase
            .from('events')
            .select('*')
            .eq('committee_id', eventData.committee_id)
            .neq('id', id)
            .order('date', { ascending: false })
            .limit(3);

          if (committeeEvents && committeeEvents.length > 0) {
            setRelatedEvents(committeeEvents as Event[]);
          } else {
            // If no committee events, fetch recent events
            const { data: recentEvents } = await supabase
              .from('events')
              .select('*')
              .neq('id', id)
              .order('date', { ascending: false })
              .limit(3);

            setRelatedEvents(recentEvents as Event[] || []);
          }
        } else {
          // If no committee, fetch recent events
          const { data: recentEvents } = await supabase
            .from('events')
            .select('*')
            .neq('id', id)
            .order('date', { ascending: false })
            .limit(3);

          setRelatedEvents(recentEvents as Event[] || []);
        }

        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'événement:', error);
        setError((error as Error).message);
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to get committee color based on name
  const getCommitteeColor = (committeeName?: string) => {
    if (!committeeName) return "bg-getigne-accent";
    return committeeColors[committeeName as keyof typeof committeeColors] || "bg-getigne-accent";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-24 flex-grow flex items-center justify-center">
          <div className="text-center">Chargement de l'événement...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return <NotFound />;
  }

  // Determine if the event has passed
  const isPastEvent = new Date(event.date).getTime() < new Date().getTime();

  // Get committee color
  const committeeColor = committee ? getCommitteeColor(committee.title) : "";
  const committeeTextColor = committeeColor.replace('bg-', 'text-');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">
                  <Home className="h-4 w-4 mr-1" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/evenements">Événements</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{event.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="max-w-5xl mx-auto mt-10">
            {/* Header with event title and committee tag if available */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 items-center mb-4">
                {isPastEvent && (
                  <span className="bg-getigne-100 text-getigne-700 px-3 py-1 rounded-full text-sm">
                    Événement passé
                  </span>
                )}

                {event.is_members_only && (
                  <span className="bg-getigne-700 text-white px-3 py-1 rounded-full text-sm flex items-center">
                    <Users size={14} className="mr-1" />
                    Réservé aux adhérents
                  </span>
                )}

                {committee && (
                  <span className={`${committeeColor} text-white px-3 py-1 rounded-full text-sm flex items-center`}>
                    <Users size={14} className="mr-1" />
                    Commission {committee.title}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-bold mb-4">{event.title}</h1>

              {/* Event details cards */}
              <div className="flex flex-wrap gap-4 my-6">
                <div className="flex items-center bg-getigne-50 px-4 py-3 rounded-lg text-getigne-700">
                  <Calendar size={20} className="text-getigne-accent mr-3" />
                  <div>
                    <div className="text-xs uppercase font-medium text-getigne-500">Date</div>
                    <div>{formatDate(event.date)}</div>
                  </div>
                </div>

                <div className="flex items-center bg-getigne-50 px-4 py-3 rounded-lg text-getigne-700">
                  <Clock size={20} className="text-getigne-accent mr-3" />
                  <div>
                    <div className="text-xs uppercase font-medium text-getigne-500">Heure</div>
                    <div>{formatTime(event.date)}</div>
                  </div>
                </div>

                <div className="flex items-center bg-getigne-50 px-4 py-3 rounded-lg text-getigne-700">
                  <MapPin size={20} className="text-getigne-accent mr-3" />
                  <div>
                    <div className="text-xs uppercase font-medium text-getigne-500">Lieu</div>
                    <div>{event.location}</div>
                  </div>
                </div>

                {committee && (
                  <div className="flex items-center bg-getigne-50 px-4 py-3 rounded-lg text-getigne-700">
                    <Users size={20} className={committeeTextColor + " mr-3"} />
                    <div>
                      <div className="text-xs uppercase font-medium text-getigne-500">Commission</div>
                      <div>{committee.title}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Main content */}
              <div className="md:col-span-2">
                <div className="prose prose-lg max-w-none">
                  <h2 className="text-2xl font-medium mb-4">À propos de cet événement</h2>
                  <p className="text-lg text-getigne-700 mb-6">{event.description}</p>

                  {/* Render event content if available */}
                  {event.content && (
                    <div dangerouslySetInnerHTML={{ __html: event.content }} className="mt-8"></div>
                  )}
                </div>

                {/* Call to action - only show for members-only events */}
                {event.is_members_only && (
                  <div className="bg-getigne-50 p-6 rounded-lg mt-8">
                    <h3 className="text-xl font-medium mb-2">Événement réservé aux adhérents</h3>
                    <p className="mb-4">Cet événement est exclusivement réservé aux adhérents de notre collectif. Rejoignez-nous pour y participer et soutenir nos actions.</p>
                    <Button
                      asChild
                      className="bg-getigne-accent text-white hover:bg-getigne-accent/90"
                    >
                      <Link to="/adherer">
                        En savoir plus sur l'adhésion
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Event image */}
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-auto"
                  />
                </div>

                {/* Related events or other sidebar content */}
                {relatedEvents.length > 0 && (
                  <div className="border border-getigne-100 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Autres événements</h3>
                    <div className="space-y-4">
                      {relatedEvents.map((relEvent) => (
                        <Link
                          key={relEvent.id}
                          to={`/evenements/${relEvent.id}`}
                          className="flex gap-3 group"
                        >
                          <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                            <img
                              src={relEvent.image}
                              alt={relEvent.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm group-hover:text-getigne-accent transition-colors line-clamp-2">
                              {relEvent.title}
                            </h4>
                            <p className="text-xs text-getigne-500">
                              {formatDate(relEvent.date)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventDetailPage;

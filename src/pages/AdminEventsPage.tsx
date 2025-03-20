
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventsManagement from '@/components/EventsManagement';
import { toast } from '@/components/ui/use-toast';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

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
  allow_registration?: boolean;
  is_members_only?: boolean;
  status?: string;
  slug?: string;
  created_at: string;
  updated_at: string;
}

interface EventFormData {
  title: string;
  description: string;
  content: string;
  date: string;
  location: string;
  image: string;
  committee_id?: string;
  allow_registration?: boolean;
  is_members_only?: boolean;
  status?: string;
  slug?: string;
}

const AdminEventsPage = () => {
  const { user, isAdmin, loading, authChecked } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [committees, setCommittees] = useState<{id: string, title: string}[]>([]);

  const fetchEvents = async () => {
    setPageLoading(true);
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          citizen_committees(id, title)
        `)
        .order('date', { ascending: false });

      if (eventsError) throw eventsError;

      const transformedData = eventsData.map(event => ({
        ...event,
        committee: event.committee || (event.citizen_committees ? event.citizen_committees.title : ''),
        status: event.status || 'published',
        allow_registration: event.allow_registration !== false,
        is_members_only: event.is_members_only || false
      }));

      setEvents(transformedData);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des événements:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Impossible de récupérer la liste des événements.",
        variant: 'destructive'
      });
    } finally {
      setPageLoading(false);
    }
  };

  const fetchCommittees = async () => {
    try {
      const { data, error } = await supabase
        .from('citizen_committees')
        .select('id, title');

      if (error) throw error;
      if (data) {
        setCommittees(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des commissions:', error);
    }
  };

  useEffect(() => {
    fetchCommittees();
  }, []);

  const handleCreateEvent = async (formData: EventFormData, status: 'draft' | 'published' | 'archived') => {
    try {
      const newEvent = {
        ...formData,
        committee: committees.find(com => com.id === formData.committee_id)?.title || '',
        status
      };

      console.log('Creating new event with data:', newEvent);

      const { data, error } = await supabase
        .from('events')
        .insert(newEvent)
        .select();

      if (error) {
        console.error('Supabase error during insert:', error);
        throw error;
      }

      console.log('Successfully created event, response:', data);

      await fetchEvents();
      return data[0];
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'événement:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Une erreur est survenue lors de la création de l'événement.",
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleUpdateEvent = async (id: string, formData: Partial<EventFormData>, status?: string) => {
    try {
      if (Object.keys(formData).length === 0 && status !== undefined) {
        const { data: existingEvent, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error('Error fetching existing event:', fetchError);
          throw fetchError;
        }

        const updateData = {
          ...existingEvent,
          status,
          updated_at: new Date().toISOString()
        };

        delete updateData.id;
        delete updateData.created_at;

        console.log('Updating event with data:', updateData);

        const { data, error } = await supabase
          .from('events')
          .update(updateData)
          .eq('id', id)
          .select();

        if (error) {
          console.error('Error updating event:', error);
          throw error;
        }

        console.log('Update response:', data);

        await fetchEvents();
        return;
      }

      let updateData: any = { ...formData };

      if (formData.committee_id) {
        updateData.committee = committees.find(com => com.id === formData.committee_id)?.title || '';
      }

      if (status !== undefined) {
        updateData.status = status;
      }

      updateData.updated_at = new Date().toISOString();

      console.log('Updating event with ID:', id);
      console.log('Complete update data:', updateData);

      const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating event:', error);
        throw error;
      }

      console.log('Update response:', data);

      await fetchEvents();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'événement:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Une erreur est survenue lors de la mise à jour de l'événement.",
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      console.log('Deleting event with ID:', id);

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error during delete:', error);
        throw error;
      }

      console.log('Successfully deleted event');

      setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Une erreur est survenue lors de la suppression de l'événement.",
        variant: 'destructive'
      });
      throw error;
    }
  };

  useEffect(() => {
    if (!authChecked) return;

    if (!user) {
      toast({
        title: 'Accès refusé',
        description: "Veuillez vous connecter pour accéder à cette page.",
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    if (user && !isAdmin) {
      toast({
        title: 'Accès refusé',
        description: "Vous n'avez pas les droits d'accès à cette page.",
        variant: 'destructive'
      });
      navigate('/');
      return;
    }

    if (user && isAdmin) {
      console.log("User is admin, fetching events");
      fetchEvents();
    }
  }, [user, isAdmin, authChecked, navigate]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && isAdmin && authChecked) {
        fetchEvents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, isAdmin, authChecked]);

  return (
    <div>
      <div className="min-h-screen">
        <Navbar />

        <div className="pt-24 pb-12 bg-getigne-50">
          <div className="container mx-auto px-4">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink to="/">
                    <Home className="h-4 w-4 mr-1" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Administration</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Événements</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="max-w-3xl mx-auto text-center">
              <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                Administration
              </span>
              <div className="text-center my-4">
                <h1 className="text-4xl md:text-5xl font-bold">Événements</h1>
              </div>
              <p className="text-getigne-700 text-lg mb-6">
                Gérez les événements du collectif.
              </p>
            </div>
          </div>
        </div>

        <section className="py-16">
          <div className="container mx-auto px-4">
            {!authChecked || loading ? (
              <div className="text-center py-10">
                <p>Vérification des droits d'accès...</p>
              </div>
            ) : !user ? (
              <div className="text-center py-10">
                <p>Veuillez vous connecter pour accéder à l'administration.</p>
              </div>
            ) : !isAdmin ? (
              <div className="text-center py-10">
                <p>Vous n'avez pas les droits pour accéder à cette page.</p>
              </div>
            ) : (
              <EventsManagement
                events={events}
                loading={pageLoading}
                onCreateEvent={handleCreateEvent}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
                committees={committees}
              />
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default AdminEventsPage;


import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client.ts';
import { useToast } from '@/components/ui/use-toast.ts';
import Navbar from '@/components/Navbar.tsx';
import Footer from '@/components/Footer.tsx';
import EventsManagement from '@/components/EventsManagement.tsx';
import { useAuth } from '@/context/auth';
import {Link, useNavigate} from 'react-router-dom';
import { Button } from '@/components/ui/button.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";
import {Home, Coffee, Calendar} from "lucide-react";
import {Helmet, HelmetProvider} from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout.tsx";

const AdminEventsPage = () => {
  const { toast } = useToast();
  const { isAdmin, isModerator } = useAuth();
  const navigate = useNavigate();

  // Query to fetch events
  const { data: allEvents = [], isLoading: isLoadingEvents, refetch: refetchEvents } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Séparer les événements réguliers et de voisinage
  const regularEvents = allEvents.filter(event => event.event_type !== 'neighborhood');
  const neighborhoodEvents = allEvents.filter(event => event.event_type === 'neighborhood');

  // Query to fetch committees for the dropdown
  const { data: committees = [] } = useQuery({
    queryKey: ['committees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citizen_committees')
        .select('id, title');

      if (error) throw error;
      return data;
    },
  });

  const handleCreateEvent = async (formData: any, status: 'draft' | 'published' | 'archived') => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...formData,
          status: status
        })
        .select()
        .single();

      if (error) throw error;

      refetchEvents();
      return data;
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création de l\'événement',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleUpdateEvent = async (id: string, formData: any, status?: string) => {
    try {
      const updateData = { ...formData };
      if (status) {
        updateData.status = status;
      }

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await refetchEvents();
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la mise à jour de l\'événement',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await refetchEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la suppression de l\'événement',
        variant: 'destructive',
      });
      throw error;
    }
  };

  if (!isAdmin && !isModerator) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold">Accès refusé</h1>
            <p className="mt-4">Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</p>
            <Button onClick={() => navigate('/')} className="mt-6">
              Retour à l'accueil
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (

      <HelmetProvider>
        <Helmet>
          <title>Gestion de l'agenda | Admin</title>
        </Helmet>

        <AdminLayout title="Gestion de l'agenda" description="Organisez les événements de Gétigné Collectif.">

          <section className="py-16">
            <div className="container mx-auto px-4">
              <Tabs defaultValue="regular" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                  <TabsTrigger value="regular" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Événements réguliers
                  </TabsTrigger>
                  <TabsTrigger value="neighborhood" className="flex items-center gap-2">
                    <Coffee className="w-4 h-4" />
                    Cafés de quartier
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="regular" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold">Événements réguliers</h2>
                    <Button asChild>
                      <Link to="/admin/events/new?type=regular">
                        <Calendar className="w-4 h-4 mr-2" />
                        Nouvel événement
                      </Link>
                    </Button>
                  </div>
                  <EventsManagement
                    events={regularEvents}
                    loading={isLoadingEvents}
                    committees={committees}
                    onCreateEvent={handleCreateEvent}
                    onUpdateEvent={handleUpdateEvent}
                    onDeleteEvent={handleDeleteEvent}
                  />
                </TabsContent>

                <TabsContent value="neighborhood" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold">Cafés de quartier</h2>
                    <Button asChild>
                      <Link to="/admin/events/new?type=neighborhood">
                        <Coffee className="w-4 h-4 mr-2" />
                        Nouvel événement
                      </Link>
                    </Button>
                  </div>
                  <EventsManagement
                    events={neighborhoodEvents}
                    loading={isLoadingEvents}
                    committees={committees}
                    onCreateEvent={handleCreateEvent}
                    onUpdateEvent={handleUpdateEvent}
                    onDeleteEvent={handleDeleteEvent}
                    isNeighborhoodEvents={true}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </section>
        </AdminLayout>
      </HelmetProvider>
  );
};

export default AdminEventsPage;

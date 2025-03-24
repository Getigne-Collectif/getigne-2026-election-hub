
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventsManagement from '@/components/EventsManagement';
import { useAuth } from '@/context/auth';
import {Link, useNavigate} from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";
import {Home} from "lucide-react";

const AdminEventsPage = () => {
  const { toast } = useToast();
  const { isAdmin, isModerator } = useAuth();
  const navigate = useNavigate();

  // Query to fetch events
  const { data: events = [], isLoading: isLoadingEvents, refetch: refetchEvents } = useQuery({
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

      <div>
        <div className="min-h-screen">
          <Navbar />

          <div className="pt-24 pb-12 bg-getigne-50">
            <div className="container mx-auto px-4">
              <Breadcrumb className="mb-6">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">
                      <Home className="h-4 w-4 mr-1" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <Link to="/admin">
                      <BreadcrumbPage>Administration</BreadcrumbPage>
                    </Link>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Agenda</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="max-w-3xl mx-auto text-center">
              <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                Administration
              </span>
                <div className="text-center my-4">
                  <h1 className="text-4xl md:text-5xl font-bold">Agenda</h1>
                </div>
                <p className="text-getigne-700 text-lg mb-6">
                  Gérez les événements du collectif.
                </p>
              </div>
            </div>
          </div>

          <section className="py-16">
            <div className="container mx-auto px-4">
            <EventsManagement
              events={events}
              loading={isLoadingEvents}
              committees={committees}
              onCreateEvent={handleCreateEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
            />
            </div>
          </section>
      </div>
      <Footer />
    </div>
  );
};

export default AdminEventsPage;

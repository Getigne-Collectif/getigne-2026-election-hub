
import React, { useEffect, useState } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { useAuth } from '@/context/AuthContext.tsx';
import { useToast } from '@/components/ui/use-toast.ts';
import Navbar from '@/components/Navbar.tsx';
import Footer from '@/components/Footer.tsx';
import SiteSettings from '@/components/admin/SiteSettings.tsx';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb.tsx";
import { Home } from 'lucide-react';
import AdminLayout from "@/components/admin/AdminLayout.tsx";

const AdminSettingsPage = () => {
  const { user, isAdmin, authChecked } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (user && isAdmin) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      if (user) {
        toast({
          variant: "destructive",
          title: "Accès restreint",
          description: "Vous n'avez pas les droits nécessaires pour accéder à cette page."
        });
        navigate('/');
      } else {
        navigate('/auth');
      }
    }
    setIsChecking(false);
  }, [user, isAdmin, authChecked, navigate, toast]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Vérification des droits d'accès...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Paramètres | Administration | Gétigné Collectif</title>
        <meta
          name="description"
          content="Administration des paramètres du site Gétigné Collectif."
        />
      </Helmet>

        <AdminLayout title="Paramètrage du site" description="Gérez les paramètres généraux du site Gétigné Collectif.">



          <div className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <SiteSettings />
              </div>
            </div>
          </div>
        </AdminLayout>
    </HelmetProvider>
  );
};

export default AdminSettingsPage;

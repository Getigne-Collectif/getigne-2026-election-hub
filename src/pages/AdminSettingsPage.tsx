
import { useEffect, useState } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SiteSettings from '@/components/admin/SiteSettings';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home } from 'lucide-react';

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

      <div className="page-content">
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
                  <BreadcrumbPage>Paramètres</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="max-w-3xl mx-auto text-center">
              <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                Administration
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Paramètres du site</h1>
              <p className="text-getigne-700 text-lg mb-6">
                Gérez les paramètres généraux du site Gétigné Collectif.
              </p>
            </div>
          </div>
        </div>

        <div className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <SiteSettings />
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default AdminSettingsPage;


import { useEffect } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CitizenCommittees from '@/components/CitizenCommittees';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home } from 'lucide-react';

const CommitteesPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <HelmetProvider>
      <Helmet>
        <title>Commissions citoyennes | Gétigné Collectif</title>
        <meta
          name="description"
          content="Découvrez les commissions citoyennes du Gétigné Collectif qui travaillent à l'élaboration du programme pour les élections municipales de 2026."
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
                  <BreadcrumbLink href="/objectif-2026">
                    Objectif 2026
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Commissions citoyennes</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            
            <div className="max-w-3xl mx-auto text-center">
              <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                Participation citoyenne
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Commissions citoyennes</h1>
              <p className="text-getigne-700 text-lg mb-6">
                Nos commissions thématiques élaborent le programme pour les prochaines élections municipales.
              </p>
            </div>
          </div>
        </div>

        <div className="py-16">
          <div className="container mx-auto px-4">
            <CitizenCommittees />
          </div>
        </div>

        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default CommitteesPage;

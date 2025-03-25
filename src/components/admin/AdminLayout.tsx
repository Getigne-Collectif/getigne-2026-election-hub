
import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Separator } from "@/components/ui/separator";
import { cn } from '@/lib/utils';
import {FileText, Home, Menu as MenuIcon} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";

interface AdminLayoutProps {
  breadcrumb?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  backLink?: ReactNode;
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ breadcrumb, title, description, backLink, children }) => {
  const location = useLocation();

  return (
      <div>
        <div className="min-h-screen">
          <Navbar />

          <div className="pt-24 pb-12 bg-getigne-50">
            <div className="container mx-auto px-4">
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
                {breadcrumb}
              </BreadcrumbList>
              {backLink}

              {title &&
                <div className="max-w-3xl mx-auto text-center">
                  <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
                    Administration
                  </span>
                  <div className="text-center my-4">
                    <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
                  </div>
                  <p className="text-getigne-700 text-lg mb-6">
                    {description}
                  </p>
                </div>
              }
            </div>
          </div>

          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  {children}
                </div>
              </div>
            </div>
          </section>
          <Footer />
        </div>
      </div>
  );
};

export default AdminLayout;

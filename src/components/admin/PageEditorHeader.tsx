
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from "lucide-react";
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

interface PageEditorHeaderProps {
  isEditMode: boolean;
}

const PageEditorHeader: React.FC<PageEditorHeaderProps> = ({ isEditMode }) => {
  const navigate = useNavigate();

  return (
    <div className="pt-8 pb-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <Home className="h-4 w-4 mr-1" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Administration</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/pages">Pages</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{isEditMode ? "Modifier la page" : "Nouvelle page"}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4">
        <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/pages')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">{isEditMode ? "Modifier la page" : "Créer une page"}</h1>
      </div>
    </div>
  );
};

export default PageEditorHeader;

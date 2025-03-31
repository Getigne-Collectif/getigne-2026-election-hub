
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProgramPage from "./pages/ProgramPage";
import NewsPage from "./pages/NewsPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import AgendaPage from "./pages/AgendaPage";
import EventDetailPage from "./pages/EventDetailPage";
import CommitteesPage from "./pages/CommitteesPage";
import CommitteePage from "./pages/CommitteePage";
import SiteMapPage from "./pages/SiteMapPage";
import JoinPage from "./pages/JoinPage";
import AboutUsPage from "./pages/AboutUsPage";
import AuthPage from "./pages/AuthPage";
import LegalPage from "./pages/LegalPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage.tsx";
import AdminNewsPage from "@/pages/admin/news/AdminNewsPage.tsx";
import ProfilePage from "@/pages/ProfilePage.tsx";
import ResetPasswordPage from "@/pages/ResetPasswordPage.tsx";
import ProfileSetupModal from "@/components/auth/ProfileSetupModal.tsx";
import AdminNewsEditorPage from '@/pages/admin/news/AdminNewsEditorPage.tsx';
import AdminEventsPage from '@/pages/admin/events/AdminEventsPage.tsx';
import AdminEventEditorPage from '@/pages/admin/events/AdminEventEditorPage.tsx';
import ObjectifPage from './pages/ObjectifPage';
import ProjectsPage from './pages/ProjectsPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage.tsx';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage.tsx';
import AdminPagesPage from '@/pages/admin/pages/AdminPagesPage.tsx';
import AdminPageEditorPage from '@/pages/admin/pages/AdminPageEditorPage.tsx';
import AdminMenuPage from '@/pages/admin/AdminMenuPage.tsx';
import DynamicPage from './pages/DynamicPage';
import ContactPage from './pages/ContactPage';
import AdminProjectsPage from "@/pages/admin/projects/AdminProjectsPage";
import AdminProjectEditorPage from "@/pages/admin/projects/AdminProjectEditorPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ProfileSetupModal />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />

              {/* Objectif 2026 et sous-pages */}
              <Route path="/objectif-2026" element={<ObjectifPage />} />
              <Route path="/objectif-2026/programme" element={<ProgramPage />} />
              <Route path="/objectif-2026/commissions" element={<CommitteesPage />} />
              <Route path="/objectif-2026/commissions/:id" element={<CommitteePage />} />

              {/* Nos projets */}
              <Route path="/nos-projets" element={<ProjectsPage />} />
              
              {/* Contact */}
              <Route path="/contact" element={<ContactPage />} />

              {/* Route principale pour "Qui sommes-nous" */}
              <Route path="/qui-sommes-nous" element={<AboutUsPage />} />

              {/* Routes existantes */}
              <Route path="/actualites" element={<NewsPage />} />
              <Route path="/actualites/:slug" element={<NewsDetailPage />} />
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/agenda/:id" element={<EventDetailPage />} />
              <Route path="/agenda/:slug" element={<EventDetailPage />} />
              <Route path="/plan-du-site" element={<SiteMapPage />} />
              <Route path="/adherer" element={<JoinPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/mentions-legales" element={<LegalPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

              {/* Routes pour les pages dynamiques - supporter la hiérarchie de pages */}
              <Route path="/pages/:slug" element={<DynamicPage />} />
              <Route path="/pages/:parent/:slug" element={<DynamicPage />} />
              <Route path="/pages/:grandparent/:parent/:slug" element={<DynamicPage />} />
              <Route path="/pages/:greatgrandparent/:grandparent/:parent/:slug" element={<DynamicPage />} />
              <Route path="/pages/:level1/:level2/:level3/:level4/:slug" element={<DynamicPage />} />
              <Route path="/pages/:level1/:level2/:level3/:level4/:level5/:slug" element={<DynamicPage />} />

              {/* Routes d'administration */}
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/news" element={<AdminNewsPage />} />
              <Route path="/admin/news/new" element={<AdminNewsEditorPage />} />
              <Route path="/admin/news/edit/:id" element={<AdminNewsEditorPage />} />
              <Route path="/admin/events" element={<AdminEventsPage />} />
              <Route path="/admin/events/new" element={<AdminEventEditorPage />} />
              <Route path="/admin/events/edit/:id" element={<AdminEventEditorPage />} />
              <Route path="/admin/projects" element={<AdminProjectsPage />} />
              <Route path="/admin/projects/new" element={<AdminProjectEditorPage />} />
              <Route path="/admin/projects/edit/:id" element={<AdminProjectEditorPage />} />
              <Route path="/admin/pages" element={<AdminPagesPage />} />
              <Route path="/admin/pages/new" element={<AdminPageEditorPage />} />
              <Route path="/admin/pages/edit/:id" element={<AdminPageEditorPage />} />
              <Route path="/admin/menu" element={<AdminMenuPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />

              {/* Routes de compatibilité (redirections pour les anciens liens) */}
              <Route path="/programme" element={<ProgramPage />} />
              <Route path="/equipe" element={<AboutUsPage />} />
              <Route path="/commissions" element={<CommitteesPage />} />
              <Route path="/commissions/:id" element={<CommitteePage />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

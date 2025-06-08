import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/context/auth";
import Index from "./pages/Index";

// Lazy load admin pages for better performance
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminNewsPage = lazy(() => import("./pages/admin/news/AdminNewsPage"));
const AdminNewsEditorPage = lazy(() => import("./pages/admin/news/AdminNewsEditorPage"));
const AdminEventsPage = lazy(() => import("./pages/admin/events/AdminEventsPage"));
const AdminEventEditorPage = lazy(() => import("./pages/admin/events/AdminEventEditorPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminPagesPage = lazy(() => import("./pages/admin/pages/AdminPagesPage"));
const AdminPageEditorPage = lazy(() => import("./pages/admin/pages/AdminPageEditorPage"));
const AdminCommitteesPage = lazy(() => import("./pages/admin/committees/AdminCommitteesPage"));
const AdminCommitteeEditorPage = lazy(() => import("./pages/admin/committees/AdminCommitteeEditorPage"));
const AdminMenuPage = lazy(() => import("./pages/admin/AdminMenuPage"));
const AdminGalaxyPage = lazy(() => import("./pages/admin/AdminGalaxyPage"));
const AdminGalaxyEditorPage = lazy(() => import("./pages/admin/AdminGalaxyEditorPage"));
const AdminProgramPage = lazy(() => import("./pages/admin/program/AdminProgramPage"));
const AdminProgramEditorPage = lazy(() => import("./pages/admin/program/AdminProgramEditorPage"));
const AdminProjectsPage = lazy(() => import("./pages/admin/projects/AdminProjectsPage"));
const AdminProjectEditorPage = lazy(() => import("./pages/admin/projects/AdminProjectEditorPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));

// Other pages
const NewsPage = lazy(() => import("./pages/NewsPage"));
const NewsDetailPage = lazy(() => import("./pages/NewsDetailPage"));
const AgendaPage = lazy(() => import("./pages/AgendaPage"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const CommitteePage = lazy(() => import("./pages/CommitteePage"));
const CommitteeDetail = lazy(() => import("./pages/committee/CommitteeDetail"));
const ProgramPage = lazy(() => import("./pages/ProgramPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const JoinPage = lazy(() => import("./pages/JoinPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const SiteMapPage = lazy(() => import("./pages/SiteMapPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DynamicPage = lazy(() => import("./pages/DynamicPage"));
const LiftPage = lazy(() => import("./pages/LiftPage"));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/news/:slug" element={<NewsDetailPage />} />
                  <Route path="/agenda" element={<AgendaPage />} />
                  <Route path="/events/:slug" element={<EventDetailPage />} />
                  <Route path="/equipe" element={<TeamPage />} />
                  <Route path="/comites" element={<CommitteePage />} />
                  <Route path="/comites/:id" element={<CommitteeDetail />} />
                  <Route path="/programme" element={<ProgramPage />} />
                  <Route path="/projets" element={<ProjectsPage />} />
                  <Route path="/nous-rejoindre" element={<JoinPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/mentions-legales" element={<LegalPage />} />
                  <Route path="/plan-du-site" element={<SiteMapPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/lift" element={<LiftPage />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/admin/news" element={<AdminNewsPage />} />
                  <Route path="/admin/news/new" element={<AdminNewsEditorPage />} />
                  <Route path="/admin/news/:id/edit" element={<AdminNewsEditorPage />} />
                  <Route path="/admin/events" element={<AdminEventsPage />} />
                  <Route path="/admin/events/new" element={<AdminEventEditorPage />} />
                  <Route path="/admin/events/:id/edit" element={<AdminEventEditorPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/pages" element={<AdminPagesPage />} />
                  <Route path="/admin/pages/new" element={<AdminPageEditorPage />} />
                  <Route path="/admin/pages/:id/edit" element={<AdminPageEditorPage />} />
                  <Route path="/admin/committees" element={<AdminCommitteesPage />} />
                  <Route path="/admin/committees/new" element={<AdminCommitteeEditorPage />} />
                  <Route path="/admin/committees/:id/edit" element={<AdminCommitteeEditorPage />} />
                  <Route path="/admin/menu" element={<AdminMenuPage />} />
                  <Route path="/admin/galaxy" element={<AdminGalaxyPage />} />
                  <Route path="/admin/galaxy/new" element={<AdminGalaxyEditorPage />} />
                  <Route path="/admin/galaxy/:id/edit" element={<AdminGalaxyEditorPage />} />
                  <Route path="/admin/program" element={<AdminProgramPage />} />
                  <Route path="/admin/program/:id/edit" element={<AdminProgramEditorPage />} />
                  <Route path="/admin/projects" element={<AdminProjectsPage />} />
                  <Route path="/admin/projects/new" element={<AdminProjectEditorPage />} />
                  <Route path="/admin/projects/:id/edit" element={<AdminProjectEditorPage />} />
                  <Route path="/admin/settings" element={<AdminSettingsPage />} />

                  {/* Dynamic pages - this should be last */}
                  <Route path="/:slug" element={<DynamicPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/context/auth";
import { Routes as AppRoutes } from "./routes";
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"
import Index from "./pages/Index";
import LoadingSpinner from "@/components/ui/loading";

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
const NeighborhoodEventsPage = lazy(() => import("./pages/NeighborhoodEventsPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const CommitteePage = lazy(() => import("./pages/CommitteePage"));
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
            <SpeedInsights />
            <Analytics />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path={AppRoutes.HOME} element={<Index />} />
                  <Route path={AppRoutes.NEWS} element={<NewsPage />} />
                  <Route path={AppRoutes.NEWS_DETAIL} element={<NewsDetailPage />} />
                  <Route path={AppRoutes.AGENDA} element={<AgendaPage />} />
                  <Route path={AppRoutes.EVENT_DETAIL} element={<EventDetailPage />} />
                  <Route path={AppRoutes.NEIGHBORHOOD_EVENTS} element={<NeighborhoodEventsPage />} />
                  <Route path={AppRoutes.TEAM} element={<TeamPage />} />
                  <Route path={AppRoutes.COMMITTEES} element={<CommitteePage />} />
                  <Route path={AppRoutes.COMMITTEE_DETAIL} element={<CommitteePage />} />
                  <Route path={AppRoutes.PROGRAM} element={<ProgramPage />} />
                  <Route path={AppRoutes.PROJECTS} element={<ProjectsPage />} />
                  <Route path={AppRoutes.JOIN} element={<JoinPage />} />
                  <Route path={AppRoutes.CONTACT} element={<ContactPage />} />
                  <Route path={AppRoutes.LEGAL} element={<LegalPage />} />
                  <Route path={AppRoutes.SITEMAP} element={<SiteMapPage />} />
                  <Route path={AppRoutes.AUTH} element={<AuthPage />} />
                  <Route path={AppRoutes.AUTH_CALLBACK} element={<AuthCallbackPage />} />
                  <Route path={AppRoutes.AUTH_RESET_PASSWORD} element={<ResetPasswordPage />} />
                  <Route path={AppRoutes.PROFILE} element={<ProfilePage />} />
                  <Route path={AppRoutes.LIFT} element={<LiftPage />} />
                  
                  {/* Admin Routes */}
                  <Route path={AppRoutes.ADMIN} element={<AdminDashboardPage />} />
                  <Route path={AppRoutes.ADMIN_NEWS} element={<AdminNewsPage />} />
                  <Route path={AppRoutes.ADMIN_NEWS_NEW} element={<AdminNewsEditorPage />} />
                  <Route path={AppRoutes.ADMIN_NEWS_EDIT} element={<AdminNewsEditorPage />} />
                  <Route path={AppRoutes.ADMIN_EVENTS} element={<AdminEventsPage />} />
                  <Route path={AppRoutes.ADMIN_EVENTS_NEW} element={<AdminEventEditorPage />} />
                  <Route path={AppRoutes.ADMIN_EVENTS_EDIT} element={<AdminEventEditorPage />} />
                  <Route path={AppRoutes.ADMIN_USERS} element={<AdminUsersPage />} />
                  <Route path={AppRoutes.ADMIN_PAGES} element={<AdminPagesPage />} />
                  <Route path={AppRoutes.ADMIN_PAGES_NEW} element={<AdminPageEditorPage />} />
                  <Route path={AppRoutes.ADMIN_PAGES_EDIT} element={<AdminPageEditorPage />} />
                  <Route path={AppRoutes.ADMIN_COMMITTEES} element={<AdminCommitteesPage />} />
                  <Route path={AppRoutes.ADMIN_COMMITTEES_NEW} element={<AdminCommitteeEditorPage />} />
                  <Route path={AppRoutes.ADMIN_COMMITTEES_EDIT} element={<AdminCommitteeEditorPage />} />
                  <Route path={AppRoutes.ADMIN_MENU} element={<AdminMenuPage />} />
                  <Route path={AppRoutes.ADMIN_GALAXY} element={<AdminGalaxyPage />} />
                  <Route path={AppRoutes.ADMIN_GALAXY_NEW} element={<AdminGalaxyEditorPage />} />
                  <Route path={AppRoutes.ADMIN_GALAXY_EDIT} element={<AdminGalaxyEditorPage />} />
                  <Route path={AppRoutes.ADMIN_PROGRAM} element={<AdminProgramPage />} />
                  <Route path={AppRoutes.ADMIN_PROGRAM_EDIT} element={<AdminProgramEditorPage />} />
                  <Route path={AppRoutes.ADMIN_PROJECTS} element={<AdminProjectsPage />} />
                  <Route path={AppRoutes.ADMIN_PROJECTS_NEW} element={<AdminProjectEditorPage />} />
                  <Route path={AppRoutes.ADMIN_PROJECTS_EDIT} element={<AdminProjectEditorPage />} />
                  <Route path={AppRoutes.ADMIN_SETTINGS} element={<AdminSettingsPage />} />

                  {/* Dynamic pages - this should be last */}
                  <Route path={AppRoutes.DYNAMIC_PAGE} element={<DynamicPage />} />
                  <Route path={AppRoutes.NOT_FOUND} element={<NotFound />} />
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


import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProgramPage from "./pages/ProgramPage";
import NewsPage from "./pages/NewsPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import AgendaPage from "./pages/AgendaPage";
import EventDetailPage from "./pages/EventDetailPage";
import TeamPage from "./pages/TeamPage";
import CommitteesPage from "./pages/CommitteesPage";
import CommitteePage from "./pages/CommitteePage";
import SiteMapPage from "./pages/SiteMapPage";
import JoinPage from "./pages/JoinPage";
import AboutUsPage from "./pages/AboutUsPage";
import AuthPage from "./pages/AuthPage";
import LegalPage from "./pages/LegalPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminNewsPage from "./pages/AdminNewsPage";
import ProfilePage from "@/pages/ProfilePage.tsx";
import ResetPasswordPage from "@/pages/ResetPasswordPage.tsx";
import ProfileSetupModal from "@/components/auth/ProfileSetupModal.tsx";
import { setupNewsImagesBucket } from "./utils/setupNewsImages";
import AdminNewsEditorPage from './pages/AdminNewsEditorPage';

const queryClient = new QueryClient();

function App() {
  // Nous retirons l'appel à setupNewsImagesBucket car le bucket existe maintenant
  // et nous n'avons plus besoin de le vérifier à chaque chargement

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
              <Route path="/programme" element={<ProgramPage />} />
              <Route path="/actualites" element={<NewsPage />} />
              <Route path="/actualites/:id" element={<NewsDetailPage />} />
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/evenements/:id" element={<EventDetailPage />} />
              <Route path="/equipe" element={<TeamPage />} />
              <Route path="/commissions" element={<CommitteesPage />} />
              <Route path="/commissions/:id" element={<CommitteePage />} />
              <Route path="/plan-du-site" element={<SiteMapPage />} />
              <Route path="/adherer" element={<JoinPage />} />
              <Route path="/qui-sommes-nous" element={<AboutUsPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/mentions-legales" element={<LegalPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/news" element={<AdminNewsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
              <Route path="/admin/actualites/creer" element={<AdminNewsEditorPage />} />
              <Route path="/admin/actualites/editer/:id" element={<AdminNewsEditorPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

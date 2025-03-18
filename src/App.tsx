
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

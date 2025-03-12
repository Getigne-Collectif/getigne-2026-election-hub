
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProgramPage from "./pages/ProgramPage";
import NewsPage from "./pages/NewsPage";
import EventsPage from "./pages/EventsPage";
import TeamPage from "./pages/TeamPage";
import ContactPage from "./pages/ContactPage";
import CommitteesPage from "./pages/CommitteesPage";
import CommitteePage from "./pages/CommitteePage";
import SiteMapPage from "./pages/SiteMapPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/programme" element={<ProgramPage />} />
          <Route path="/actualites" element={<NewsPage />} />
          <Route path="/evenements" element={<EventsPage />} />
          <Route path="/equipe" element={<TeamPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/commissions" element={<CommitteesPage />} />
          <Route path="/commissions/:id" element={<CommitteePage />} />
          <Route path="/plan-du-site" element={<SiteMapPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

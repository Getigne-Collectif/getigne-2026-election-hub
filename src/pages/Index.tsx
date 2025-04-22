
import { Helmet, HelmetProvider } from "react-helmet-async";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import News from "@/components/News";
import Events from "@/components/Events";
import Team from "@/components/Team";
import Values from "@/components/Values";
import Campaign from "@/components/Campaign";
import { useAppSettings } from "@/hooks/useAppSettings";

const Index = () => {
  const { settings } = useAppSettings();
  
  return (
    <HelmetProvider>
      <Helmet>
        <title>Gétigné Collectif | Ensemble pour une commune écologique, solidaire et démocratique</title>
        <meta
          name="description"
          content="Gétigné Collectif rassemble des citoyens et citoyennes engagés pour une commune plus écologique, solidaire et démocratique."
        />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Navbar />
        <Hero />
        <Values />
        <Campaign />
        <Events />
        <News limit={3} />
        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default Index;

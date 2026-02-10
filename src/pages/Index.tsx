
import { Helmet, HelmetProvider } from "react-helmet-async";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import News from "@/components/News";
import Events from "@/components/Events";
import Team from "@/components/Team";
import Values from "@/components/Values";
import Campaign from "@/components/Campaign";
import FloatingMenu from "@/components/FloatingMenu";
import { useAppSettings } from "@/hooks/useAppSettings";

const Index = () => {
  const { settings } = useAppSettings();
  
  return (
    <HelmetProvider>
      <Helmet>
        <title>{settings.branding.name} | {settings.content.siteDescription}</title>
        <meta
          name="description"
          content={settings.content.siteDescription}
        />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Navbar />
        <Hero />
        <Values />
        <Campaign />
        {settings.modules.agenda && <Events />}
        {settings.modules.blog && <News limit={3} />}
        <Footer />
        <FloatingMenu />
      </div>
    </HelmetProvider>
  );
};

export default Index;

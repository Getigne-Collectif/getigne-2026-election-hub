
import { Helmet, HelmetProvider } from "react-helmet-async";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Program from "@/components/Program";
import News from "@/components/News";
import Events from "@/components/Events";
import CitizenCommittees from "@/components/CitizenCommittees";
import Team from "@/components/Team";
import Values from "@/components/Values";

const Index = () => (
  <HelmetProvider>
    <Helmet>
      <title>Collectif Gétigné | Ensemble pour une commune écologique, solidaire et démocratique</title>
      <meta
        name="description"
        content="Le Collectif Gétigné rassemble des citoyens et citoyennes engagés pour une commune plus écologique, solidaire et démocratique."
      />
    </Helmet>

    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Hero />
      <Program />
      <Values />
      <News />
      <Events />
      <CitizenCommittees />
      <Team />
      <Footer />
    </div>
  </HelmetProvider>
);

export default Index;

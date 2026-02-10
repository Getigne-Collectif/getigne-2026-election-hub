
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Users, Heart, Zap, Landmark, LayoutList, PiggyBank, Home, ArrowRight, CheckCircle2, HandHeart, PenLine, Search } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb.tsx";
import ContactForm from "@/components/ContactForm";
import { usePostHog } from "@/hooks/usePostHog";
import SupportCommitteeForm from "@/components/SupportCommitteeForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useAppSettings } from "@/hooks/useAppSettings";

interface Supporter {
  id: number;
  first_name: string;
  last_name: string;
  city: string;
}

const JoinPage = () => {
  const location = useLocation();
  const { capture } = usePostHog();
  const { settings } = useAppSettings();
  const [isSupportFormOpen, setIsSupportFormOpen] = useState(false);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const showSupportCommittee = settings.modules.supportCommittee;
  const showMembershipForm = settings.modules.membershipForm;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (showSupportCommittee) {
      fetchSupporters();
    }
    
    // Check if URL has #contact hash
    if (location.hash === '#contact') {
      setTimeout(() => {
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
          contactForm.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }, [location, showSupportCommittee]);

  const fetchSupporters = async () => {
    if (!showSupportCommittee) return;
    const { data, error } = await supabase
      .from('support_committee')
      .select('id, first_name, last_name, city')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erreur lors de la récupération des soutiens.");
      console.error(error);
    } else {
      setSupporters(data);
    }
  };

  const HELLOASSO_JOIN_URL = import.meta.env.VITE_HELLOASSO_JOIN_URL as string;

  const handleJoinClick = () => {
    capture('helloasso_join_click', {
      source: 'join_page',
      url: HELLOASSO_JOIN_URL,
      timestamp: new Date().toISOString()
    });
    window.open(HELLOASSO_JOIN_URL, '_blank');
  };

  const handleDonationClick = () => {
    capture('donation_click', {
      source: 'join_page',
      url: 'https://www.helloasso.com/beta/associations/getigne-collectif/formulaires/2',
      timestamp: new Date().toISOString()
    });
    window.open('https://www.helloasso.com/beta/associations/getigne-collectif/formulaires/2', '_blank');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredSupporters = supporters.filter((supporter) => {
    const search = searchQuery.toLowerCase();
    const firstName = supporter.first_name?.toLowerCase() || "";
    const lastName = supporter.last_name?.toLowerCase() || "";
    const city = supporter.city?.toLowerCase() || "";
    
    return (
      firstName.includes(search) ||
      lastName.includes(search) ||
      city.includes(search)
    );
  });

  return (
    <HelmetProvider>
      <Helmet>
        <title>Comment nous aider ? | Gétigné Collectif</title>
        <meta
          name="description"
          content="Rejoignez notre collectif citoyen : affichez votre soutien ou devenez adhérent pour participer activement à la vie démocratique de Gétigné."
        />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Navbar />

        {/* Hero Section */}
        <div className="pt-24 pb-12 bg-brand-50 border-b border-brand-100">
          <div className="container mx-auto px-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">
                    <Home className="h-4 w-4 mr-1" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Comment nous aider ?</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="max-w-4xl mx-auto text-center mt-8">
              <span className="bg-brand/10 text-brand font-medium px-4 py-1 rounded-full text-sm">
                Participez à l'aventure
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mt-6 mb-6">Comment nous aider ?</h1>
              <p className="text-brand-700 text-lg md:text-xl mb-10 max-w-3xl mx-auto leading-relaxed">
                Il existe plusieurs façons de soutenir Gétigné Collectif, selon vos envies et vos disponibilités. Chaque geste compte pour construire ensemble l'avenir de notre commune.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {showSupportCommittee && (
                  <Button 
                    size="lg" 
                    className="bg-brand hover:bg-brand/90 text-brand-fg px-8"
                    onClick={() => scrollToSection('support-committee')}
                  >
                    <PenLine className="mr-2 h-5 w-5 fill-current" /> Signer le comité de soutien
                  </Button>
                )}
                {showMembershipForm && (
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-brand text-brand hover:bg-brand/5 px-8"
                    onClick={() => scrollToSection('membership')}
                  >
                    <Users className="mr-2 h-5 w-5" /> Devenir adhérent
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <main className="flex-grow">
          {/* Section 1: Comité de soutien (Engagement léger) */}
          {showSupportCommittee && (
          <section id="support-committee" className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 flex items-center gap-3">
                      <span className="bg-brand text-brand-fg w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0">1</span>
                      Affichez votre soutien
                    </h2>
                    <p className="text-brand-700 text-lg mb-6 leading-relaxed">
                      Vous appréciez notre démarche mais vous manquez de temps pour vous engager activement ? 
                      Rejoignez notre <strong>comité de soutien</strong>.
                    </p>
                    <p className="text-brand-700 mb-8">
                      C'est un geste simple qui ne coûte rien mais qui nous donne du poids et de la visibilité auprès des habitants et des institutions. En signant, vous affirmez votre adhésion aux valeurs de transparence et de participation citoyenne que nous portons.
                    </p>
                    <div className="space-y-4 mb-8">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="text-brand h-6 w-6 shrink-0 mt-0.5" />
                        <p className="text-brand-800 font-medium">Rapide : moins de 30 secondes</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="text-brand h-6 w-6 shrink-0 mt-0.5" />
                        <p className="text-brand-800 font-medium">Gratuit et sans engagement de temps</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="text-brand h-6 w-6 shrink-0 mt-0.5" />
                        <p className="text-brand-800 font-medium">Affichage de votre nom parmi nos soutiens</p>
                      </div>
                    </div>
                    <Button 
                      size="lg" 
                      className="bg-brand hover:bg-brand/90 text-brand-fg w-full sm:w-auto"
                      onClick={() => setIsSupportFormOpen(true)}
                    >
                      Je rejoins le comité de soutien
                    </Button>
                  </div>
                  <div className="bg-white rounded-3xl p-8 md:p-10 border border-brand-100 shadow-xl shadow-brand-100/50 overflow-hidden h-full min-h-[450px] flex flex-col relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
                    
                    <h3 className="text-2xl font-bold mb-8 flex items-center justify-between border-b border-brand-50 pb-6 relative z-10">
                      Ils/elles nous soutiennent
                      <span className="bg-brand text-brand-fg px-4 py-1.5 rounded-full text-sm font-extrabold shadow-md shadow-brand/20">
                        {supporters.length}
                      </span>
                    </h3>

                    <div className="mb-6 relative z-10">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400" />
                        <Input
                          placeholder="Rechercher un signataire ou une ville..."
                          className="pl-10 bg-brand-50/50 border-brand-100 focus:bg-white transition-all rounded-xl"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto pr-2 max-h-[450px] custom-scrollbar relative z-10">
                      {filteredSupporters.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {filteredSupporters.map((supporter) => (
                            <div 
                              key={supporter.id} 
                              className="bg-brand-50/80 px-5 py-2.5 rounded-2xl border border-brand-100 flex items-center gap-2 shadow-sm"
                            >
                              <p className="text-brand-900 text-sm md:text-base whitespace-nowrap">
                                <span className="font-bold">
                                  {supporter.first_name} {supporter.last_name}
                                </span>
                                {supporter.city && (
                                  <span className="text-brand-400 ml-1 text-xs md:text-sm">
                                    , {supporter.city}
                                  </span>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                          <div className="bg-brand-50 p-6 rounded-full mb-6">
                            <Users className="h-16 w-12 text-brand-200" />
                          </div>
                          <p className="text-brand-500 text-lg font-medium">
                            {searchQuery ? "Aucun signataire ne correspond à votre recherche." : "Soyez le premier à signer notre comité de soutien !"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* Transition Divider */}
          {showSupportCommittee && showMembershipForm && (
            <div className="bg-brand-50 py-10">
              <div className="container mx-auto px-4 flex justify-center">
                <div className="bg-white p-4 rounded-full shadow-sm border border-brand-100 flex items-center gap-3 animate-bounce">
                  <p className="text-sm font-medium text-brand-600">Vous voulez aller plus loin ?</p>
                  <ArrowRight className="h-4 w-4 text-brand rotate-90" />
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Adhésion (Engagement fort) */}
          {showMembershipForm && (
          <section id="membership" className="py-20 bg-brand-50">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <div className="mb-12 text-center">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6 flex items-center justify-center gap-3">
                    <span className="bg-brand text-brand-fg w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0">2</span>
                    Adhérez à l'association
                  </h2>
                  <p className="text-brand-700 text-lg max-w-3xl mx-auto leading-relaxed">
                    L'adhésion est l'acte fondateur pour participer pleinement à la vie du collectif. Elle vous permet d'être acteur du projet, de voter lors des assemblées et de contribuer aux décisions.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-12">
                  <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm p-8 md:p-10 h-full border border-brand-100">
                      <div className="grid md:grid-cols-2 gap-10">
                        <div>
                          <h3 className="text-xl font-bold mb-6 text-brand-900 border-b border-brand-100 pb-2">Pourquoi adhérer ?</h3>
                          <ul className="space-y-6">
                            <li className="flex gap-4">
                              <div className="mt-1 w-10 h-10 bg-brand/10 rounded-xl flex-shrink-0 flex items-center justify-center">
                                <Users className="text-brand h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-brand-900 leading-tight mb-1">Faire partie du collectif</h4>
                                <p className="text-sm text-brand-600">Rejoignez un groupe de citoyens engagés pour le bien commun.</p>
                              </div>
                            </li>
                            <li className="flex gap-4">
                              <div className="mt-1 w-10 h-10 bg-brand/10 rounded-xl flex-shrink-0 flex items-center justify-center">
                                <Zap className="text-brand h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-brand-900 leading-tight mb-1">Participer aux décisions</h4>
                                <p className="text-sm text-brand-600">Votez lors des AG et contribuez aux orientations stratégiques.</p>
                              </div>
                            </li>
                            <li className="flex gap-4">
                              <div className="mt-1 w-10 h-10 bg-brand/10 rounded-xl flex-shrink-0 flex items-center justify-center">
                                <LayoutList className="text-brand h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-brand-900 leading-tight mb-1">Accès privilégié</h4>
                                <p className="text-sm text-brand-600">Participez à nos rencontres et ateliers réservés aux membres.</p>
                              </div>
                            </li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-xl font-bold mb-6 text-brand-900 border-b border-brand-100 pb-2">Notre organisation</h3>
                          <ul className="space-y-6">
                            <li className="flex gap-4">
                              <div className="mt-1 w-10 h-10 bg-brand/10 rounded-xl flex-shrink-0 flex items-center justify-center">
                                <Landmark className="text-brand h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-brand-900 leading-tight mb-1">Association Loi 1901</h4>
                                <p className="text-sm text-brand-600">Structure à but non lucratif, gérée démocratiquement.</p>
                              </div>
                            </li>
                            <li className="flex gap-4">
                              <div className="mt-1 w-10 h-10 bg-brand/10 rounded-xl flex-shrink-0 flex items-center justify-center">
                                <PiggyBank className="text-brand h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-brand-900 leading-tight mb-1">Transparence totale</h4>
                                <p className="text-sm text-brand-600">Financement exclusif par les cotisations et dons.</p>
                              </div>
                            </li>
                            <li className="flex gap-4">
                              <div className="mt-1 w-10 h-10 bg-brand/10 rounded-xl flex-shrink-0 flex items-center justify-center">
                                <Heart className="text-brand h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-brand-900 leading-tight mb-1">100% Bénévole</h4>
                                <p className="text-sm text-brand-600">Engagement par conviction, sans intérêt personnel.</p>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="border-t border-brand-100 pt-10 mt-10">
                        <div className="text-center mb-8">
                          <p className="text-brand-700 bg-brand-50 p-6 rounded-xl border border-brand-100 inline-block max-w-2xl">
                            {settings.content.membershipText}
                          </p>
                        </div>

                        <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-6">
                          <Button
                            size="lg"
                            className="bg-brand hover:bg-brand/90 text-brand-fg shadow-md shadow-brand/20 h-14 px-10 text-lg"
                            onClick={handleJoinClick}
                          >
                            Adhérer en ligne sur HelloAsso
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
                            className="border-brand text-brand hover:bg-brand/5 h-14 px-10 text-lg"
                            onClick={handleDonationClick}
                          >
                            Faire un don libre
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6 h-full justify-between">
                    <div className="rounded-2xl overflow-hidden shadow-md flex-grow">
                      <img
                        src={settings.branding.images.joinMembershipPrimary}
                        alt="Réunion du collectif"
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                      />
                    </div>
                    <div className="rounded-2xl overflow-hidden shadow-md flex-grow">
                      <img
                        src={settings.branding.images.joinMembershipSecondary}
                        alt="Réunion du collectif à l'extérieur"
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* Contact Form Section */}
          <section id="contact-form" className="py-20 px-4 bg-white border-t border-brand-100">
            <div className="container mx-auto">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <span className="bg-brand/10 text-brand font-medium px-4 py-1 rounded-full text-sm">
                  Des questions ?
                </span>
                <h2 className="text-3xl font-bold mt-4 mb-6">Contactez-nous</h2>
                <p className="text-brand-700 text-lg">
                  Vous avez des questions sur l'adhésion, le fonctionnement du collectif ou vous souhaitez simplement nous parler ? Écrivez-nous !
                </p>
              </div>

              <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-brand-100 p-8 md:p-12">
                <ContactForm showParticipation={true} showNewsletter={true} />
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      {showSupportCommittee && (
        <SupportCommitteeForm
          open={isSupportFormOpen}
          onOpenChange={setIsSupportFormOpen}
          onSuccess={() => {
            setIsSupportFormOpen(false);
            fetchSupporters();
          }}
        />
      )}
    </HelmetProvider>
  );
};

export default JoinPage;

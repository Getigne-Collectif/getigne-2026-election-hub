import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  CheckCircle2,
  Search,
  UserCheck,
  Info,
  ExternalLink,
  Home,
  Vote,
  Shield,
  FileText,
  Handshake,
} from 'lucide-react';
import ProcurationForm from '@/components/procuration/ProcurationForm';
import { proxyFormDefaultValues, type ProxyFormValues } from '@/utils/proxyForm';
import type { ProxyRequestType } from '@/types/proxy.types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { subscribeToNewsletter } from '@/utils/newsletter';
import { sendDiscordNotification, DiscordColors } from '@/utils/notifications';

const MAPROXY_URL = 'https://www.maprocuration.gouv.fr';

export default function ProcurationPage() {
  const [successType, setSuccessType] = useState<ProxyRequestType | null>(null);
  const [sharedFormValues, setSharedFormValues] = useState<ProxyFormValues>(() => ({ ...proxyFormDefaultValues }));

  const handleSubmit = (type: ProxyRequestType) => async (values: ProxyFormValues) => {
    const { error } = await supabase.from('proxy_requests').insert({
      type,
      first_name: values.firstName,
      last_name: values.lastName,
      national_elector_number: values.nationalElectorNumber,
      phone: values.phone,
      email: values.email,
      voting_bureau: values.votingBureau ?? null,
      support_committee_consent: values.supportCommitteeConsent,
      newsletter_consent: values.newsletterConsent,
    });

    if (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.');
      throw error;
    }

    try {
      const isRequester = type === 'requester';
      await sendDiscordNotification({
        title: isRequester
          ? '🗳️ Procuration – Quelqu\'un cherche un mandataire'
          : '🗳️ Procuration – Quelqu\'un propose de porter une procuration',
        message: `
**${values.firstName} ${values.lastName}**
**Email**: ${values.email}
**Tél.**: ${values.phone}
**NNE**: ${values.nationalElectorNumber}
**Bureau de vote**: ${values.votingBureau != null ? `Bureau ${values.votingBureau}` : 'Non renseigné'}
**Comité de soutien**: ${values.supportCommitteeConsent ? 'Oui' : 'Non'}
**Newsletter**: ${values.newsletterConsent ? 'Oui' : 'Non'}
        `.trim(),
        color: DiscordColors.BLUE,
        username: 'Espace procuration',
        url: `${window.location.origin}/procuration`,
      });
    } catch (discordError) {
      console.error('Erreur notification Discord procuration:', discordError);
    }

    if (values.supportCommitteeConsent) {
      try {
        await supabase.from('support_committee').insert({
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
          subscribed_to_newsletter: values.newsletterConsent,
        });
      } catch {
        // Ignore duplicate or other support_committee errors
      }
    }

    if (values.newsletterConsent) {
      try {
        await subscribeToNewsletter({
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          source: 'Procuration',
        });
      } catch {
        toast.warning("Nous n'avons pas pu vous inscrire à la newsletter.");
      }
    }

    setSuccessType(type);
    toast.success('Votre demande a bien été enregistrée. Nous vous tiendrons informé(e).');
  };

  if (successType !== null) {
    return (
      <HelmetProvider>
        <Helmet>
          <title>Espace procuration | Gétigné Collectif</title>
          <meta name="description" content="Demande de procuration pour les élections municipales de Gétigné - 15 mars 2026." />
        </Helmet>
        <div className="min-h-screen bg-white">
          <Navbar />
          <section className="pt-32 pb-24 px-4 relative bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 overflow-hidden min-h-[60vh] flex items-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-200/20 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="container mx-auto max-w-2xl text-center relative">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-blue-200 inline-block">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-getigne-900 mb-4">
                  Demande enregistrée
                </h1>
                <p className="text-getigne-700 mb-6">
                  {successType === 'requester'
                    ? "Nous avons bien reçu votre demande. Dès que nous aurons trouvé une personne disponible pour voter à votre place, nous vous contacterons par email ou téléphone."
                    : "Merci de vous être proposé(e) pour porter une procuration. Dès qu'une personne correspondante sera identifiée, nous vous contacterons."}
                </p>
                <p className="text-sm text-getigne-600">
                  Vous pouvez fermer cette page. Nous vous tiendrons au courant.
                </p>
              </div>
            </div>
          </section>
          <Footer />
        </div>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Espace procuration | Gétigné Collectif</title>
        <meta name="description" content="Demande de procuration pour les élections municipales de Gétigné - 15 mars 2026. Trouvez quelqu'un pour voter à votre place ou proposez de porter une procuration." />
      </Helmet>
      <div className="min-h-screen bg-white">
        <Navbar />

        <main className="pt-20">
          {/* Bloc principal : 1/3 texte + 2/3 formulaires */}
          <section className="relative bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 py-8 lg:py-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-200/20 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="container mx-auto px-4 relative">
              <Breadcrumb className="mb-6">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/" className="flex items-center">
                        <Home className="w-4 h-4 mr-1" />
                        Accueil
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="flex items-center">
                      <Vote className="w-4 h-4 mr-1" />
                      Procuration
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-start">
                {/* Gauche : titre, sous-titre, bloc bleu avec contenu descriptif (1/3) */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                    <Info className="w-4 h-4 mr-2" />
                    Élections municipales 2026
                  </div>

                  <h1 className="text-4xl lg:text-5xl font-bold text-getigne-900 leading-tight">
                    Espace procuration
                  </h1>

                  <p className="text-lg text-getigne-700 leading-relaxed">
                    Pour les élections municipales 2026, il n'y aura qu'un seul tour à Gétigné le <strong className="text-blue-600">15 mars 2026</strong> et chaque voix sera déterminante. Si vous ne pouvez pas vous rendre à votre bureau de vote ou si vous voulez vous porter volontaire pour voter à la place de quelqu'un, déposez une demande.
                  </p>

                  {/* Bloc bleu visuel avec contenu descriptif dedans */}
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <div className="w-full min-h-[280px] bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col items-center justify-center py-12 relative">
                      <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Handshake className="w-6 h-6 text-white" />
                      </div>
                      <Vote className="w-24 h-24 lg:w-32 lg:h-32 text-white/90" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-blue-100">
                        <p className="text-getigne-900 font-medium mb-2">
                          Nous faisons le lien
                        </p>
                        <p className="text-getigne-700 text-sm leading-relaxed">
                          Nous mettons en relation les personnes qui cherchent un mandataire et celles qui acceptent de voter à leur place. Dès que le binôme sera formé, vous recevrez un email avec les coordonnées et les instructions pour la démarche sur <a href={MAPROXY_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5"><span className="inline-block ml-0.5" aria-hidden>🇫🇷</span> maprocuration.gouv.fr<ExternalLink className="w-3 h-3 shrink-0" /></a>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Droite : double formulaire (2/3) */}
                <div className="lg:col-span-2">
                  <Tabs defaultValue="requester" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4 h-auto p-1 bg-blue-100/50 border border-blue-200">
                      <TabsTrigger
                        value="requester"
                        className="flex items-center justify-center gap-1.5 sm:gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm py-2.5 sm:py-3 text-sm sm:text-base"
                      >
                        <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="hidden sm:inline">Je cherche quelqu'un pour voter pour moi</span>
                        <span className="sm:hidden">Je cherche</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="volunteer"
                        className="flex items-center justify-center gap-1.5 sm:gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm py-2.5 sm:py-3 text-sm sm:text-base"
                      >
                        <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="hidden sm:inline">Je suis disponible pour porter une procuration</span>
                        <span className="sm:hidden">Je propose</span>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="requester">
                      <Card className="border-blue-100 shadow-lg">
                        <CardHeader className="border-b border-blue-100/50 bg-gradient-to-r from-blue-50/50 to-transparent pb-4">
                          <CardTitle className="flex items-center gap-2 text-getigne-900 text-lg">
                            <Search className="w-5 h-5 text-blue-600" />
                            Demander un mandataire
                          </CardTitle>
                          <CardDescription className="text-left">
                            Vous ne serez pas présent(e) le 15 mars 2026 ? Déposez vos coordonnées. Nous vous recontacterons dès qu'une personne aura été trouvée pour voter à votre place.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <ProcurationForm
                            type="requester"
                            onSubmit={handleSubmit('requester')}
                            submitLabel="Envoyer ma demande"
                            defaultValues={sharedFormValues}
                            onValuesChange={setSharedFormValues}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="volunteer">
                      <Card className="border-blue-100 shadow-lg">
                        <CardHeader className="border-b border-blue-100/50 bg-gradient-to-r from-blue-50/50 to-transparent pb-4">
                          <CardTitle className="flex items-center gap-2 text-getigne-900 text-lg">
                            <UserCheck className="w-5 h-5 text-blue-600" />
                            Proposer de porter une procuration
                          </CardTitle>
                          <CardDescription className="text-left">
                            Vous serez présent(e) au bureau de vote le 15 mars 2026 et vous acceptez de voter au nom d'une autre personne ? Indiquez vos coordonnées pour que nous puissions vous mettre en relation.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <ProcurationForm
                            type="volunteer"
                            onSubmit={handleSubmit('volunteer')}
                            submitLabel="Me proposer comme mandataire"
                            defaultValues={sharedFormValues}
                            onValuesChange={setSharedFormValues}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </section>

          {/* Comment ça marche */}
          <section className="py-16 bg-gradient-to-b from-blue-50/30 to-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-getigne-900 mb-4">
                    Comment ça marche ?
                  </h2>
                  <p className="text-lg text-getigne-700 max-w-2xl mx-auto">
                    Une fois votre demande enregistrée, nous faisons le lien. Dès qu'un binôme est formé, vous recevrez un email avec les coordonnées et les instructions. La procédure officielle se fait ensuite sur <a href={MAPROXY_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1">maprocuration.gouv.fr <span className="inline-block ml-0.5" aria-hidden>🇫🇷</span> <ExternalLink className="w-3 h-3" /></a>.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="border-0 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-3 text-getigne-900">1. Vous remplissez le formulaire</h3>
                      <p className="text-getigne-700 text-sm leading-relaxed">
                        Indiquez si vous cherchez un mandataire ou si vous proposez d'en être un.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserCheck className="w-8 h-8 text-sky-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-3 text-getigne-900">2. Nous formons les binômes</h3>
                      <p className="text-getigne-700 text-sm leading-relaxed">
                        L'équipe associe les demandes et les propositions. Dès qu'un match est trouvé, nous vous contactons.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-3 text-getigne-900">3. Démarche sur maprocuration.gouv.fr</h3>
                      <p className="text-getigne-700 text-sm leading-relaxed">
                        Vous recevrez par email les infos de l'autre personne pour remplir le formulaire en ligne.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </HelmetProvider>
  );
}

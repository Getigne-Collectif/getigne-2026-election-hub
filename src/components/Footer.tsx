
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useState } from 'react';
import { subscribeToNewsletter, NewsletterSubscription } from '../utils/newsletter';
import { toast } from 'sonner';
import {DiscordLogoIcon} from "@radix-ui/react-icons";
import FacebookIcon from '@/components/icons/facebook.svg?react';
import { Routes } from '@/routes';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const DISCORD_INVITE_URL = import.meta.env.VITE_DISCORD_INVITE_URL as string;

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Veuillez saisir votre adresse email");
      return;
    }

    setIsSubmitting(true);

    try {
      const subscription: NewsletterSubscription = { email };
      await subscribeToNewsletter(subscription);
      toast.success("Merci de votre inscription à notre newsletter !");
      setEmail(''); // Réinitialiser le champ email
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      toast.error("Une erreur est survenue lors de l'inscription. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-getigne-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About */}
          <div>
            <div className="mb-4">
              <img
                src="/images/getigne-collectif-logo.png"
                alt="Gétigné Collectif"
                className="h-14 mb-4"
              />
            </div>
            <p className="text-getigne-100 mb-6">
              Collectif citoyen engagé pour les élections municipales depuis 2020 à Gétigné.
              Ensemble, construisons une commune plus solidaire, écologique et participative.
            </p>
            <div className="flex space-x-4">
              <a href="#" aria-label="Facebook">
                <FacebookIcon />
              </a>
              <a href={DISCORD_INVITE_URL} className="text-getigne-100 hover:text-white transition-colors" aria-label="Discord" target="_blank" rel="noopener noreferrer">
                <DiscordLogoIcon />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xl font-medium mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link to={Routes.HOME} className="text-getigne-100 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to={Routes.PROGRAM} className="text-getigne-100 hover:text-white transition-colors">
                  Élections 2026
                </Link>
              </li>
              <li>
                <Link to={Routes.PROJECTS} className="text-getigne-100 hover:text-white transition-colors">
                  Nos projets citoyens
                </Link>
              </li>
              <li>
                <Link to={Routes.NEWS} className="text-getigne-100 hover:text-white transition-colors">
                  Actualités
                </Link>
              </li>
              <li>
                <Link to={Routes.AGENDA} className="text-getigne-100 hover:text-white transition-colors">
                  Événements
                </Link>
              </li>
              <li>
                <Link to={Routes.CONTACT} className="text-getigne-100 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to={Routes.SITEMAP} className="text-getigne-100 hover:text-white transition-colors">
                  Plan du site
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-medium mb-4">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <Mail size={20} className="mr-3 text-getigne-accent mt-1 flex-shrink-0" />
                <span className="text-getigne-100">contact@getigne-collectif.fr</span>
              </li>
              <li className="flex items-start">
                <Phone size={20} className="mr-3 text-getigne-accent mt-1 flex-shrink-0" />
                <span className="text-getigne-100">06 66 77 75 20</span>
              </li>
              <li className="flex items-start">
                <MapPin size={20} className="mr-3 text-getigne-accent mt-1 flex-shrink-0" />
                <span className="text-getigne-100">
                  19 le bois de la roche<br />
                  44190 Gétigné
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xl font-medium mb-4">Restez informés</h3>
            <p className="text-getigne-100 mb-4">
              Inscrivez-vous à notre newsletter pour suivre nos actualités et événements.
            </p>
            <form className="space-y-3" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                placeholder="Votre email"
                className="bg-getigne-800 text-white w-full px-4 py-2 rounded-md border border-getigne-700 focus:outline-none focus:ring-2 focus:ring-getigne-accent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-getigne-accent hover:bg-getigne-accent/90 text-white font-medium px-4 py-2 rounded-md w-full transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Envoi...' : "S'inscrire"}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-getigne-800 mt-12 pt-8 text-center text-getigne-400 text-sm">
          <div className="flex flex-col md:flex-row justify-center space-y-2 md:space-y-0 md:space-x-6 mb-2">
            <Link to={Routes.LEGAL} className="hover:text-white transition-colors">
              Mentions légales
            </Link>
          </div>
          <p>© {currentYear} Gétigné Collectif. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

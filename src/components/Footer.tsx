
import { Link } from 'react-router-dom';
import { Facebook, Mail, Phone, MapPin, MessageSquare } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-getigne-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About */}
          <div>
            <div className="mb-4">
              <img 
                src="/lovable-uploads/ef5618c7-2730-4f0e-bccf-554d89c7ff53.png" 
                alt="Gétigné Collectif" 
                className="h-14 mb-4"
              />
            </div>
            <p className="text-getigne-100 mb-6">
              Collectif citoyen engagé pour les élections municipales de 2026 à Gétigné.
              Ensemble, construisons une commune plus solidaire, écologique et participative.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-getigne-100 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://discord.gg/ePHjxJssex" className="text-getigne-100 hover:text-white transition-colors" aria-label="Discord" target="_blank" rel="noopener noreferrer">
                <MessageSquare size={20} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xl font-medium mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-getigne-100 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/programme" className="text-getigne-100 hover:text-white transition-colors">
                  Programme
                </Link>
              </li>
              <li>
                <Link to="/actualites" className="text-getigne-100 hover:text-white transition-colors">
                  Actualités
                </Link>
              </li>
              <li>
                <Link to="/evenements" className="text-getigne-100 hover:text-white transition-colors">
                  Événements
                </Link>
              </li>
              <li>
                <Link to="/equipe" className="text-getigne-100 hover:text-white transition-colors">
                  Notre équipe
                </Link>
              </li>
              <li>
                <Link to="/commissions" className="text-getigne-100 hover:text-white transition-colors">
                  Commissions
                </Link>
              </li>
              <li>
                <Link to="/plan-du-site" className="text-getigne-100 hover:text-white transition-colors">
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
                <span className="text-getigne-100">06 12 34 56 78</span>
              </li>
              <li className="flex items-start">
                <MapPin size={20} className="mr-3 text-getigne-accent mt-1 flex-shrink-0" />
                <span className="text-getigne-100">
                  Local du collectif<br />
                  1 rue de la Mairie<br />
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
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Votre email"
                className="bg-getigne-800 text-white w-full px-4 py-2 rounded-md border border-getigne-700 focus:outline-none focus:ring-2 focus:ring-getigne-accent"
                required
              />
              <button
                type="submit"
                className="bg-getigne-accent hover:bg-getigne-accent/90 text-white font-medium px-4 py-2 rounded-md w-full transition-colors"
              >
                S'inscrire
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-getigne-800 mt-12 pt-8 text-center text-getigne-400 text-sm">
          <p>© {currentYear} Gétigné Collectif. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

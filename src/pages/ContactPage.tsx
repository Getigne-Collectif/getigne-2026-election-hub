
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

const ContactPage = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page-content">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto"><h1 className="text-3xl font-bold mb-4 text-center">Contactez-nous</h1>
          <p className="text-getigne-700 text-center">
            Vous avez des questions ou des suggestions ? N'hésitez pas à nous contacter.
          </p>
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8 mt-5">
            <div className="text-center mb-10">

            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-getigne-800 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="w-full px-4 py-2 border border-getigne-200 rounded-md focus:outline-none focus:ring-2 focus:ring-getigne-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-getigne-800 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    className="w-full px-4 py-2 border border-getigne-200 rounded-md focus:outline-none focus:ring-2 focus:ring-getigne-green-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-getigne-800 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 border border-getigne-200 rounded-md focus:outline-none focus:ring-2 focus:ring-getigne-green-500"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-getigne-800 mb-1">
                  Sujet
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full px-4 py-2 border border-getigne-200 rounded-md focus:outline-none focus:ring-2 focus:ring-getigne-green-500"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-getigne-800 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full px-4 py-2 border border-getigne-200 rounded-md focus:outline-none focus:ring-2 focus:ring-getigne-green-500"
                ></textarea>
              </div>

              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                <Send className="mr-2 h-4 w-4" /> Envoyer
              </Button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;

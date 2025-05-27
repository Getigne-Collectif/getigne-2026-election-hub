
import React from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LiftLayoutProps {
  children: React.ReactNode;
}

const LiftLayout: React.FC<LiftLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header spécial Lift */}
      <header className="bg-white shadow-sm border-b-2 border-orange-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center text-orange-600 hover:text-orange-700 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                <span className="text-sm">Retour à Gétigné Collectif</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-orange-900" style={{ fontFamily: 'Georgia, serif' }}>
                    Lift
                  </h1>
                  <p className="text-xs text-orange-600">Covoiturage solidaire</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default LiftLayout;

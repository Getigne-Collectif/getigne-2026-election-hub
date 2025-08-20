import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useAuth } from '@/context/auth';
import UserAvatar from '@/components/UserAvatar';

interface LiftLayoutProps {
  children: React.ReactNode;
}

const LiftLayout: React.FC<LiftLayoutProps> = ({ children }) => {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header spécial Lift */}
      <header className="bg-white shadow-sm border-b-2 border-blue-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                <span className="text-sm">Retour à Gétigné Collectif</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <UserAvatar user={user} profile={profile} size="md" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-blue-900 font-playwrite">
                    Lift
                  </h1>
                  <p className="text-xs text-blue-600">Covoiturage solidaire</p>
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

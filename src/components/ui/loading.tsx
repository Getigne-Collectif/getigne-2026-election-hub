import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-getigne-100 border-t-getigne-accent rounded-full animate-spin"></div>
        </div>
        <p className="text-getigne-700 text-sm font-medium">Chargement...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

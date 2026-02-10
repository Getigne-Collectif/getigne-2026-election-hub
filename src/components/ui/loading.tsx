import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-brand-100 border-t-brand rounded-full animate-spin"></div>
        </div>
        <p className="text-brand-700 text-sm font-medium">Chargement...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

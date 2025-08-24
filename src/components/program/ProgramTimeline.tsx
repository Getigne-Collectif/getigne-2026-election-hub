import React, { useState } from 'react';
import { CheckCircle2, Clock, Users, FileText, Presentation, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TimelineStep {
  id: string;
  title: string;
  description: string;
  period: string;
  status: 'completed' | 'current' | 'upcoming';
  details?: string[];
}

interface ProgramTimelineProps {
  steps: TimelineStep[];
  className?: string;
  compact?: boolean;
  mini?: boolean;
  showToggle?: boolean;
}

const ProgramTimeline: React.FC<ProgramTimelineProps> = ({ 
  steps, 
  className = '', 
  compact = false, 
  mini = false, 
  showToggle = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'current':
        return <Clock className="w-5 h-5 text-getigne-accent animate-pulse" />;
      case 'upcoming':
        return <Clock className="w-5 h-5 text-getigne-300" />;
    }
  };

  const getStatusColor = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'current':
        return 'text-getigne-700 bg-getigne-accent/10 border-getigne-accent';
      case 'upcoming':
        return 'text-getigne-500 bg-white border-getigne-200';
    }
  };

  const getStepNumberColor = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'current':
        return 'bg-getigne-accent text-white';
      case 'upcoming':
        return 'bg-getigne-200 text-getigne-600';
    }
  };

  // Si showToggle est activé et qu'on est en mode compact/mini, on peut basculer
  if (showToggle && (compact || mini) && isExpanded) {
    return (
      <div className={className}>
        {/* Version détaillée sans récursion */}
        <div className="space-y-8">
          {/* Timeline principale avec design moderne */}
          <div className="relative">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center text-center flex-1 relative z-10">
                    {/* Cercle principal avec effet de profondeur */}
                    <div className={`w-20 h-20 rounded-full border-4 ${getStatusColor(step.status)} flex items-center justify-center mb-4 transition-all duration-300 hover:scale-110 shadow-lg`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getStepNumberColor(step.status)} shadow-inner`}>
                        {index + 1}
                      </div>
                    </div>
                    
                    {/* Titre */}
                    <h3 className="text-lg font-bold text-getigne-900 mb-2">{step.title}</h3>
                    
                    {/* Période avec badge stylé */}
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-getigne-accent/10 text-getigne-700 text-sm font-semibold rounded-full border border-getigne-accent/20">
                        {step.period}
                      </span>
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-getigne-700 leading-relaxed max-w-xs mb-3">{step.description}</p>
                    
                    {/* Statut avec animation */}
                    <div className="flex items-center gap-2">
                      {getStatusIcon(step.status)}
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                        step.status === 'completed' ? 'bg-green-100 text-green-700' :
                        step.status === 'current' ? 'bg-getigne-accent/20 text-getigne-700' :
                        'bg-getigne-100 text-getigne-600'
                      }`}>
                        {step.status === 'completed' ? 'Terminé' :
                         step.status === 'current' ? 'En cours' : 'À venir'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Ligne de connexion avec effet */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 relative">
                      <div className="h-1 bg-gradient-to-r from-getigne-200 to-getigne-300 rounded-full mx-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-getigne-accent/20 to-getigne-accent/40 animate-pulse"></div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {/* Détails des étapes - Design en cartes modernes */}
          {steps.some(step => step.details && step.details.length > 0) && (
            <div className="mt-12">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-getigne-900 mb-2">Détails de chaque étape</h3>
                <p className="text-getigne-700">Découvrez le contenu spécifique de chaque phase du processus</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {steps.map((step) => (
                  step.details && step.details.length > 0 && (
                    <div key={`details-${step.id}`} className="group relative">
                      {/* Carte avec effet de survol */}
                      <div className="bg-white rounded-2xl p-6 border-2 border-getigne-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-getigne-accent/30">
                        {/* En-tête de la carte */}
                        <div className="mb-4">
                          <h4 className="font-bold text-getigne-900 text-lg mb-2">{step.title}</h4>
                          <p className="text-sm text-getigne-600 font-medium">{step.period}</p>
                        </div>
                        
                        {/* Liste des détails avec design moderne */}
                        <ul className="space-y-3">
                          {step.details.map((detail, detailIndex) => (
                            <li key={detailIndex} className="flex items-start gap-3 group/item">
                              <div className="w-2 h-2 bg-getigne-accent rounded-full mt-2.5 flex-shrink-0 group-hover/item:scale-125 transition-transform duration-200" />
                              <span className="text-sm text-getigne-700 leading-relaxed group-hover/item:text-getigne-900 transition-colors duration-200">
                                {detail}
                              </span>
                            </li>
                          ))}
                        </ul>
                        
                        {/* Badge de statut en bas */}
                        <div className="mt-4 pt-4 border-t border-getigne-100">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              step.status === 'completed' ? 'bg-green-100 text-green-700' :
                              step.status === 'current' ? 'bg-getigne-accent/20 text-getigne-700' :
                              'bg-getigne-100 text-getigne-600'
                            }`}>
                              {step.status === 'completed' ? '✓ Terminé' :
                               step.status === 'current' ? '🔄 En cours' : '⏳ À venir'}
                            </span>
                            {step.status !== 'upcoming' && getStatusIcon(step.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="text-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-getigne-700 hover:text-getigne-900"
          >
            <ChevronUp className="w-4 h-4 mr-2" />
            Voir moins
          </Button>
        </div>
      </div>
    );
  }

  if (mini) {
    // Version mini ultra-compacte
    return (
      <div className={className}>
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl border-2 ${getStatusColor(step.status)} transition-all duration-200 shadow-sm hover:shadow-md`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${getStepNumberColor(step.status)}`}>
                  {index + 1}
                </div>
                <span className="font-medium whitespace-nowrap text-center leading-tight text-xs">{step.title}</span>
                <span className="text-xs opacity-75 whitespace-nowrap font-medium">{step.period}</span>
              </div>
              
              {index < steps.length - 1 && (
                <div className="w-6 h-0.5 bg-getigne-200 rounded-full" />
              )}
            </React.Fragment>
          ))}
        </div>
        
        {showToggle && (
          <div className="text-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="text-getigne-700 hover:text-getigne-900"
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              En savoir plus
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (compact) {
    // Version compacte horizontale
    return (
      <div className={className}>
        <div className="flex items-center justify-center gap-3">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex flex-col items-center gap-2 px-4 py-3 rounded-2xl border-2 ${getStatusColor(step.status)} transition-all duration-200 text-center shadow-sm hover:shadow-md hover:scale-105`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${getStepNumberColor(step.status)}`}>
                  {index + 1}
                </div>
                <span className="text-sm font-semibold whitespace-nowrap">{step.title}</span>
                <span className="text-xs opacity-80 whitespace-nowrap font-medium">{step.period}</span>
                <div className="mt-1">
                  {getStatusIcon(step.status)}
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="w-10 h-0.5 bg-getigne-200 rounded-full" />
              )}
            </React.Fragment>
          ))}
        </div>
        
        {showToggle && (
          <div className="text-center mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="text-getigne-700 hover:text-getigne-900"
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              En savoir plus
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Version détaillée horizontale - Design moderne et percutant
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Timeline principale avec design moderne */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center text-center flex-1 relative z-10">
                {/* Cercle principal avec effet de profondeur */}
                <div className={`w-20 h-20 rounded-full border-4 ${getStatusColor(step.status)} flex items-center justify-center mb-4 transition-all duration-300 hover:scale-110 shadow-lg`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getStepNumberColor(step.status)} shadow-inner`}>
                    {index + 1}
                  </div>
                </div>
                
                {/* Titre avec icône */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-getigne-900">{step.title}</h3>
                </div>
                
                {/* Période avec badge stylé */}
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-getigne-accent/10 text-getigne-700 text-sm font-semibold rounded-full border border-getigne-accent/20">
                    {step.period}
                  </span>
                </div>
                
                {/* Description */}
                <p className="text-sm text-getigne-700 leading-relaxed max-w-xs mb-3">{step.description}</p>
                
                {/* Statut avec animation */}
                <div className="flex items-center gap-2">
                  {getStatusIcon(step.status)}
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    step.status === 'completed' ? 'bg-green-100 text-green-700' :
                    step.status === 'current' ? 'bg-getigne-accent/20 text-getigne-700' :
                    'bg-getigne-100 text-getigne-600'
                  }`}>
                    {step.status === 'completed' ? 'Terminé' :
                     step.status === 'current' ? 'En cours' : 'À venir'}
                  </span>
                </div>
              </div>
              
              {/* Ligne de connexion avec effet */}
              {index < steps.length - 1 && (
                <div className="flex-1 relative">
                  <div className="h-1 bg-gradient-to-r from-getigne-200 to-getigne-300 rounded-full mx-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-getigne-accent/20 to-getigne-accent/40 animate-pulse"></div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Détails des étapes - Design en cartes modernes */}
      {steps.some(step => step.details && step.details.length > 0) && (
        <div className="mt-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-getigne-900 mb-2">Détails de chaque étape</h3>
            <p className="text-getigne-700">Découvrez le contenu spécifique de chaque phase du processus</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {steps.map((step) => (
              step.details && step.details.length > 0 && (
                <div key={`details-${step.id}`} className="group relative">
                  {/* Carte avec effet de survol */}
                  <div className="bg-white rounded-2xl p-6 border-2 border-getigne-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-getigne-accent/30">
                    {/* En-tête de la carte */}
                    <div className="mb-4">
                      <h4 className="font-bold text-getigne-900 text-lg mb-2">{step.title}</h4>
                      <p className="text-sm text-getigne-600 font-medium">{step.period}</p>
                    </div>
                    
                    {/* Liste des détails avec design moderne */}
                    <ul className="space-y-3">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start gap-3 group/item">
                          <div className="w-2 h-2 bg-getigne-accent rounded-full mt-2.5 flex-shrink-0 group-hover/item:scale-125 transition-transform duration-200" />
                          <span className="text-sm text-getigne-700 leading-relaxed group-hover/item:text-getigne-900 transition-colors duration-200">
                            {detail}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* Badge de statut en bas */}
                    <div className="mt-4 pt-4 border-t border-getigne-100">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          step.status === 'completed' ? 'bg-green-100 text-green-700' :
                          step.status === 'current' ? 'bg-getigne-accent/20 text-getigne-700' :
                          'bg-getigne-100 text-getigne-600'
                        }`}>
                          {step.status === 'completed' ? '✓ Terminé' :
                           step.status === 'current' ? '🔄 En cours' : '⏳ À venir'}
                        </span>
                        {step.status !== 'upcoming' && getStatusIcon(step.status)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramTimeline;

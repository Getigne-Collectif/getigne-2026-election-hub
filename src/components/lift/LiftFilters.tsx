import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, ChevronUp, RotateCcw, Check } from 'lucide-react';

interface LiftFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onApplyFilters: (filters: any) => void;
  showPastEvents: boolean;
  onTogglePastEvents: (show: boolean) => void;
}

const LiftFilters: React.FC<LiftFiltersProps> = ({
  isOpen,
  onClose,
  onOpen,
  onApplyFilters,
  showPastEvents,
  onTogglePastEvents,
}) => {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    departureSearch: '',
    arrivalSearch: '',
    recurrence: 'all',
    timeFrom: '',
    timeTo: '',
    availableSeats: '',
  });

  const [drawerHeight, setDrawerHeight] = useState(400);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(0);

  // Réinitialiser la hauteur quand le drawer est ouvert
  useEffect(() => {
    if (isOpen) {
      setDrawerHeight(400);
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = drawerHeight;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    const deltaY = dragStartYRef.current - e.clientY;
    const newHeight = Math.max(30, Math.min(window.innerHeight * 0.8, dragStartHeightRef.current + deltaY));
    
    if (newHeight <= 30) {
      onClose();
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    } else {
      setDrawerHeight(newHeight);
    }
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  };

  // Nettoyage des event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleApplyFilters = () => {
    // Convert "all" back to empty string for the filter logic
    const processedFilters = {
      ...filters,
      recurrence: filters.recurrence === 'all' ? '' : filters.recurrence,
    };
    onApplyFilters(processedFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      dateFrom: '',
      dateTo: '',
      departureSearch: '',
      arrivalSearch: '',
      recurrence: 'all',
      timeFrom: '',
      timeTo: '',
      availableSeats: '',
    };
    setFilters(resetFilters);
    // Convert "all" back to empty string for the filter logic
    const processedFilters = {
      ...resetFilters,
      recurrence: '',
    };
    onApplyFilters(processedFilters);
  };

  return (
    <>
      {/* Poignée/Bouton persistant en bas */}
      {!isOpen && (
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-40">
          <Button
            onClick={onOpen}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-t-lg rounded-b-none px-6 py-3 shadow-lg"
          >
            <Filter className="mr-2" size={18} />
            Filtres
            <ChevronUp className="ml-2" size={16} />
          </Button>
        </div>
      )}

      {/* Drawer redimensionnable en bas */}
      {isOpen && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-blue-200 shadow-2xl"
          style={{ height: `${drawerHeight}px` }}
        >
          {/* Poignée de redimensionnement */}
          <div
            onMouseDown={handleMouseDown}
            className="w-full h-2 bg-blue-100 cursor-row-resize flex items-center justify-center hover:bg-blue-200 transition-colors"
          >
            <div className="w-16 h-1.5 bg-blue-400 rounded-full hover:h-4 transition-all"></div>
          </div>

          <Card className="border-none rounded-none h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between bg-blue-50 border-b py-3 px-6">
              <CardTitle className="text-blue-900 flex items-center text-lg">
                <Filter className="mr-2" size={18} />
                Filtres
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  <RotateCcw size={16} className="mr-1" />
                  Reset
                </Button>
                <Button size="sm" onClick={handleApplyFilters} className="bg-blue-600 hover:bg-blue-700">
                  <Check size={16} className="mr-1" />
                  Appliquer
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Période - From/To */}
              <div className="flex gap-4">
                <fieldset className="border border-gray-200 rounded-lg p-3 flex-1">
                  <legend className="text-sm font-medium text-gray-700 px-2">À partir du</legend>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    />
                    <Input
                      type="time"
                      value={filters.timeFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, timeFrom: e.target.value }))}
                    />
                  </div>
                </fieldset>

                <fieldset className="border border-gray-200 rounded-lg p-3 flex-1">
                  <legend className="text-sm font-medium text-gray-700 px-2">Jusqu'au</legend>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    />
                    <Input
                      type="time"
                      value={filters.timeTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, timeTo: e.target.value }))}
                    />
                  </div>
                </fieldset>
              </div>

              {/* Lieux */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departure-search">Lieu de départ</Label>
                  <Input
                    id="departure-search"
                    placeholder="ex: gare clisson, gétigné..."
                    value={filters.departureSearch}
                    onChange={(e) => setFilters(prev => ({ ...prev, departureSearch: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">
                    Recherche par mots-clés (séparés par des espaces)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrival-search">Lieu d'arrivée</Label>
                  <Input
                    id="arrival-search"
                    placeholder="ex: nantes, cholet..."
                    value={filters.arrivalSearch}
                    onChange={(e) => setFilters(prev => ({ ...prev, arrivalSearch: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">
                    Recherche par mots-clés (séparés par des espaces)
                  </p>
                </div>
              </div>

              {/* Options diverses */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="recurrence" className="text-sm">Type :</Label>
                  <Select value={filters.recurrence} onValueChange={(value) => setFilters(prev => ({ ...prev, recurrence: value }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="once">Une fois</SelectItem>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Label htmlFor="seats" className="text-sm">Places :</Label>
                  <Input
                    id="seats"
                    type="number"
                    min="1"
                    max="8"
                    placeholder="1-8"
                    className="w-20"
                    value={filters.availableSeats}
                    onChange={(e) => setFilters(prev => ({ ...prev, availableSeats: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-past-events"
                    checked={showPastEvents}
                    onCheckedChange={onTogglePastEvents}
                  />
                  <Label htmlFor="show-past-events" className="text-sm">
                    Événements passés
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default LiftFilters;

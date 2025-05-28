
import React, { useState } from 'react';
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
import { X, Filter } from 'lucide-react';

interface LiftFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
  showPastEvents: boolean;
  onTogglePastEvents: (show: boolean) => void;
}

const LiftFilters: React.FC<LiftFiltersProps> = ({
  isOpen,
  onClose,
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
  });

  const handleApplyFilters = () => {
    // Convert "all" back to empty string for the filter logic
    const processedFilters = {
      ...filters,
      recurrence: filters.recurrence === 'all' ? '' : filters.recurrence,
    };
    onApplyFilters(processedFilters);
    onClose();
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
    };
    setFilters(resetFilters);
    // Convert "all" back to empty string for the filter logic
    const processedFilters = {
      ...resetFilters,
      recurrence: '',
    };
    onApplyFilters(processedFilters);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <Card className="w-full max-w-4xl m-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-blue-900 flex items-center">
            <Filter className="mr-2" size={20} />
            Filtres de recherche
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Période</Label>
              <div className="space-y-2">
                <Input
                  type="date"
                  placeholder="Date de début"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
                <Input
                  type="date"
                  placeholder="Date de fin"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Horaires</Label>
              <div className="space-y-2">
                <Input
                  type="time"
                  placeholder="Heure de début"
                  value={filters.timeFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, timeFrom: e.target.value }))}
                />
                <Input
                  type="time"
                  placeholder="Heure de fin"
                  value={filters.timeTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, timeTo: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type de récurrence</Label>
              <Select value={filters.recurrence} onValueChange={(value) => setFilters(prev => ({ ...prev, recurrence: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="once">Une fois</SelectItem>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
                Recherche dans les lieux de départ (mots-clés séparés par des espaces)
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
                Recherche dans les lieux d'arrivée (mots-clés séparés par des espaces)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-past-events"
                checked={showPastEvents}
                onCheckedChange={onTogglePastEvents}
              />
              <Label htmlFor="show-past-events">
                Afficher les événements passés
              </Label>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleResetFilters}>
              Réinitialiser
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={handleApplyFilters} className="bg-blue-600 hover:bg-blue-700">
                Appliquer les filtres
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiftFilters;

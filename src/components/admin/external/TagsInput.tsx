import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
}

const TagsInput = ({ value, onChange, suggestions = [], placeholder = "Ajouter une étiquette...", className }: TagsInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]);
      setInputValue('');
      setOpen(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  // Filtrer les suggestions pour exclure les tags déjà sélectionnés
  const availableSuggestions = suggestions.filter(s => !value.includes(s));
  
  // Filtrer selon la saisie
  const filteredSuggestions = availableSuggestions.filter(s =>
    s.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className={cn("space-y-2", className)}>
      {/* Tags sélectionnés */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="pl-2 pr-1 py-1 text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 rounded-full hover:bg-muted p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input avec suggestions */}
      <div className="flex gap-2">
        {suggestions.length > 0 ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setOpen(true);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="pr-10"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Rechercher une étiquette..." />
                <CommandList>
                  <CommandEmpty>
                    {inputValue ? (
                      <div className="text-center py-2">
                        <p className="text-sm text-muted-foreground mb-2">Aucune suggestion</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addTag(inputValue)}
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Créer "{inputValue}"
                        </Button>
                      </div>
                    ) : (
                      "Aucune étiquette disponible"
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredSuggestions.map((tag) => (
                      <CommandItem
                        key={tag}
                        value={tag}
                        onSelect={() => addTag(tag)}
                      >
                        {tag}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : (
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1"
          />
        )}
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => addTag(inputValue)}
          disabled={!inputValue.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Appuyez sur Entrée ou cliquez sur + pour ajouter une étiquette
      </p>
    </div>
  );
};

export default TagsInput;

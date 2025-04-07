
import { useState, useMemo } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import * as icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

// Liste des icônes pertinentes pour un programme politique/municipal
const programIcons = [
  "AirVent", "Accessibility", "Activity", "AlarmClock", "Album", "AlertCircle", "AlertTriangle",
  "Anchor", "Aperture", "Apple", "Archive", "ArrowRight", "AtSign", "Award", "Badgecheck", "BadgeInfo",
  "Backpack", "Bank", "BarChart", "BarChart2", "BarChart3", "BarChart4", "Battery", "Beaker", "Bell",
  "Bike", "Binary", "Bird", "Briefcase", "Brush", "Building", "Building2", "Bus", "Calculator",
  "Calendar", "Camera", "Car", "Castle", "Check", "CheckCheck", "CheckCircle", "ChevronDown", 
  "CircleDot", "Clipboard", "ClipboardCheck", "Clock", "Cloud", "CloudRain", "Code", "Coffee", 
  "Coins", "Command", "Compass", "Construction", "CreditCard", "Crop", "Database", "Droplet", 
  "Droplets", "Edit", "FilePlus", "FileText", "Filter", "Flag", "Flame", "FlaskConical", "Flower", 
  "Folder", "FolderOpen", "Gift", "GraduationCap", "Hammer", "HandCoins", "HandHelping", "HandHeart", 
  "HardHat", "Hash", "Headphones", "Heart", "HeartHandshake", "Home", "Hotel", "Hourglass", "Image", 
  "Info", "Key", "Landmark", "Languages", "Layers", "LayoutDashboard", "LeafyGreen", "Library", 
  "LifeBuoy", "Lightbulb", "Link", "Loader", "Lock", "LogIn", "Mail", "Map", "MapPin", "Medical", 
  "MessageCircle", "MessageSquare", "Mic", "Monitor", "Moon", "Mountain", "MousePointer", "Network", 
  "Newspaper", "Package", "Paintbrush", "Palette", "Paperclip", "PawPrint", "PenTool", "Percent", 
  "PersonStanding", "Phone", "PieChart", "Plane", "Plant", "Plus", "Printer", "Puzzle", "Recycle", 
  "RotateCcw", "Ruler", "School", "Scissors", "Search", "Send", "Server", "Settings", "Share", 
  "Shield", "ShieldCheck", "ShoppingBag", "ShoppingCart", "SmilePlus", "Sparkles", "SpeakerLoud", 
  "Star", "Sun", "SunMoon", "Sunrise", "Sunset", "Table", "Tablet", "Tag", "Target", "Terminal", 
  "ThumbsUp", "Ticket", "Timer", "Tool", "Tractor", "TrainFront", "Trash", "Trash2", "Tree", 
  "Trophy", "Truck", "Umbrella", "Users", "Utensils", "Vote", "Wallet", "Wind"
];

export interface IconSelectProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function IconSelect({ value, onChange, className }: IconSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIcons = useMemo(() => {
    if (!searchQuery) return programIcons;
    return programIcons.filter(icon => 
      icon.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelect = (icon: string) => {
    onChange(icon);
    setOpen(false);
  };

  // Récupérer l'icône actuelle
  const IconComponent = value ? (icons as any)[value] : icons.Image;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2">
            {IconComponent && <IconComponent className="h-4 w-4" />}
            <span>{value || "Sélectionner une icône"}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Rechercher une icône..." 
            onValueChange={setSearchQuery}
            className="h-9"
          />
          <CommandList className="max-h-80">
            <CommandEmpty>Aucune icône trouvée.</CommandEmpty>
            <CommandGroup>
              <div className="grid grid-cols-3 gap-1 p-1">
                {filteredIcons.map((iconName) => {
                  const Icon = (icons as any)[iconName];
                  return (
                    <CommandItem
                      key={iconName}
                      value={iconName}
                      onSelect={() => handleSelect(iconName)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 gap-1 cursor-pointer rounded hover:bg-accent",
                        value === iconName && "bg-accent"
                      )}
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                      <span className="text-xs truncate max-w-full">{iconName}</span>
                      {value === iconName && (
                        <div className="absolute top-1 right-1">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </CommandItem>
                  );
                })}
              </div>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

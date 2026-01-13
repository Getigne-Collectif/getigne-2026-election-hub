import { Card, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

const ExternalContactsPlaceholder = () => {
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="py-16 px-6 text-center">
        <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
          <div className="rounded-full bg-muted p-6">
            <Building2 className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight">
              Contacts externes - À venir
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              Cette section affichera prochainement les contacts externes tels que les associations partenaires, 
              les organisations locales et autres acteurs du territoire avec lesquels nous collaborons.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExternalContactsPlaceholder;

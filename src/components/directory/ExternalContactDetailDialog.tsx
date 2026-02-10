import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Edit,
  Download,
  FileText,
  Save,
  X as XIcon,
  Loader2
} from 'lucide-react';
import type { ExternalContactWithGroups, ExternalContact } from '@/types/external-directory.types';
import { downloadExternalContactVCard } from '@/utils/vcard';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import TagsInput from '@/components/admin/external/TagsInput';
import GroupSelector, { GroupWithRole } from '@/components/admin/external/GroupSelector';

interface ExternalContactDetailDialogProps {
  contact: ExternalContactWithGroups | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (contactId: string) => void;
  onUpdate?: () => void;
}

const ExternalContactDetailDialog = ({ 
  contact, 
  open, 
  onOpenChange,
  onEdit,
  onUpdate
}: ExternalContactDetailDialogProps) => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);

  const [formData, setFormData] = useState<Partial<ExternalContact>>({});
  const [selectedGroups, setSelectedGroups] = useState<GroupWithRole[]>([]);

  useEffect(() => {
    if (contact && open) {
      setFormData({
        first_name: contact.first_name,
        last_name: contact.last_name,
        photo_url: contact.photo_url,
        email: contact.email,
        phone: contact.phone,
        city: contact.city,
        note: contact.note,
        tags: contact.tags || [],
      });
      
      setSelectedGroups(
        contact.groups?.map(g => ({
          groupId: g.group.id,
          role: g.role || '',
        })) || []
      );
      
      fetchAllTags();
    }
  }, [contact, open]);

  const fetchAllTags = async () => {
    try {
      const { data } = await supabase
        .from('external_contacts')
        .select('tags');
      
      const tagsSet = new Set<string>();
      data?.forEach(item => {
        item.tags?.forEach(tag => tagsSet.add(tag));
      });
      
      setAllTags(Array.from(tagsSet).sort());
    } catch (error) {
      console.error('Erreur lors de la récupération des tags:', error);
    }
  };

  if (!contact) return null;

  const fullName = contact.last_name 
    ? `${contact.first_name} ${contact.last_name}`
    : contact.first_name;

  const handleDownload = () => {
    downloadExternalContactVCard(contact);
    toast({
      title: 'vCard téléchargée',
      description: `Contact de ${fullName} exporté avec succès`,
    });
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Restaurer les données originales
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      photo_url: contact.photo_url,
      email: contact.email,
      phone: contact.phone,
      city: contact.city,
      note: contact.note,
      tags: contact.tags || [],
    });
    
    setSelectedGroups(
      contact.groups?.map(g => ({
        groupId: g.group.id,
        role: g.role || '',
      })) || []
    );
  };

  const handleSave = async () => {
    if (!contact) return;

    if (!formData.first_name?.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le prénom est obligatoire',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Mettre à jour le contact
      const { error: contactError } = await supabase
        .from('external_contacts')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          photo_url: formData.photo_url,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          note: formData.note,
          tags: formData.tags,
        })
        .eq('id', contact.id);

      if (contactError) throw contactError;

      // Supprimer les anciennes liaisons
      const { error: deleteError } = await supabase
        .from('external_contact_groups')
        .delete()
        .eq('contact_id', contact.id);

      if (deleteError) throw deleteError;

      // Créer les nouvelles liaisons
      if (selectedGroups.length > 0) {
        const { error: insertError } = await supabase
          .from('external_contact_groups')
          .insert(
            selectedGroups.map(g => ({
              contact_id: contact.id,
              group_id: g.groupId,
              role: g.role || null,
            }))
          );

        if (insertError) throw insertError;
      }

      toast({
        title: 'Contact mis à jour',
        description: 'Les modifications ont été enregistrées avec succès',
      });

      setIsEditMode(false);
      if (onUpdate) onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le contact',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Détails du contact</DialogTitle>
          <DialogDescription className="sr-only">
            Informations complètes sur {fullName}
          </DialogDescription>
        </DialogHeader>

        {isEditMode ? (
          /* Mode édition */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Modifier le contact</h2>
              <div className="flex gap-2">
                <Button onClick={handleCancelEdit} variant="outline" size="sm" disabled={saving}>
                  <XIcon className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleSave} size="sm" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo_url">URL de la photo</Label>
                <Input
                  id="photo_url"
                  type="url"
                  value={formData.photo_url || ''}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Étiquettes</Label>
                <TagsInput
                  tags={formData.tags || []}
                  onChange={(tags) => setFormData({ ...formData, tags })}
                  suggestions={allTags}
                />
              </div>

              <div className="space-y-2">
                <Label>Groupes</Label>
                <GroupSelector
                  selectedGroups={selectedGroups}
                  onChange={setSelectedGroups}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  value={formData.note || ''}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={4}
                  placeholder="Informations complémentaires..."
                />
              </div>
            </div>
          </div>
        ) : (
          /* Mode détails */
          <div className="space-y-6">
            {/* En-tête avec photo et nom */}
            <div className="flex items-start gap-4">
            <div className="w-24 h-24 flex-shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-brand-200 to-brand-100 border-4 border-brand-300">
              {contact.photo_url ? (
                <img
                  src={contact.photo_url}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-12 w-12 text-brand-700" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-brand-900">{fullName}</h2>
              {contact.city && (
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {contact.city}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <Button onClick={handleDownload} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger vCard
                </Button>
                {isAdmin && onEdit && (
                  <Button onClick={handleEdit} size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Coordonnées */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand-600" />
              Coordonnées
            </h3>
            <div className="grid gap-3">
              {contact.email && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a 
                      href={`mailto:${contact.email}`}
                      className="text-sm font-medium hover:text-brand-600 truncate block"
                    >
                      {contact.email}
                    </a>
                  </div>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <a 
                      href={`tel:${contact.phone}`}
                      className="text-sm font-medium hover:text-brand-600"
                    >
                      {contact.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Groupes */}
          {contact.groups && contact.groups.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  Groupes ({contact.groups.length})
                </h3>
                <div className="space-y-2">
                  {contact.groups.map((g) => (
                    <div 
                      key={g.id} 
                      className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-lg border border-emerald-200"
                    >
                      <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-200 to-emerald-100">
                        {g.group.logo_url ? (
                          <img
                            src={g.group.logo_url}
                            alt={g.group.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-emerald-700" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{g.group.name}</p>
                        {g.role && (
                          <p className="text-xs text-emerald-700 mt-0.5">{g.role}</p>
                        )}
                        {g.group.city && (
                          <p className="text-xs text-muted-foreground mt-0.5">{g.group.city}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Étiquettes</h3>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Note / Bio */}
          {contact.note && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand-600" />
                  Note
                </h3>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{contact.note}</p>
                </div>
              </div>
            </>
          )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExternalContactDetailDialog;

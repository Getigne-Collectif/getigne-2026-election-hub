import React, { useState, useCallback } from 'react';
import { OutputData } from '@editorjs/editorjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, X } from 'lucide-react';
import EditorJSComponent from '@/components/EditorJSComponent';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface LexiconEntryFormData {
  name: string;
  acronym: string;
  content: OutputData;
  external_link: string;
  logo_url: string | null;
}

interface LexiconEntryFormProps {
  onSubmit: (data: LexiconEntryFormData) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<LexiconEntryFormData>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const LexiconEntryForm: React.FC<LexiconEntryFormProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
  isSubmitting = false,
  submitLabel = 'Enregistrer',
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<LexiconEntryFormData>({
    name: defaultValues?.name || '',
    acronym: defaultValues?.acronym || '',
    content: defaultValues?.content || {
      time: Date.now(),
      blocks: [],
      version: '2.28.0',
    },
    external_link: defaultValues?.external_link || '',
    logo_url: defaultValues?.logo_url || null,
  });

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    defaultValues?.logo_url || null
  );

  const handleChange = (field: keyof LexiconEntryFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleContentChange = useCallback((data: OutputData) => {
    setFormData((prev) => ({
      ...prev,
      content: data,
    }));
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Le fichier doit être une image',
      });
      return;
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'L\'image ne doit pas dépasser 2 Mo',
      });
      return;
    }

    setIsUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `lexicon_logos/${fileName}`;

      // Uploader le fichier
      const { error: uploadError } = await supabase.storage
        .from('news_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Récupérer l'URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from('news_images').getPublicUrl(filePath);

      setFormData((prev) => ({
        ...prev,
        logo_url: publicUrl,
      }));
      setLogoPreview(publicUrl);

      toast({
        title: 'Succès',
        description: 'Logo téléchargé avec succès',
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement du logo:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de télécharger le logo',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logo_url: null,
    }));
    setLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Empêcher la propagation vers les éléments parents (comme la dialog)

    // Validation
    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Le nom est obligatoire',
      });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">
              Nom complet <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange('name')}
              placeholder="ex: Organisation des Nations Unies"
              required
            />
          </div>

          <div>
            <Label htmlFor="acronym">Acronyme (optionnel)</Label>
            <Input
              id="acronym"
              value={formData.acronym}
              onChange={handleChange('acronym')}
              placeholder="ex: ONU"
            />
          </div>

          <div>
            <Label htmlFor="external_link">Lien externe (optionnel)</Label>
            <Input
              id="external_link"
              type="url"
              value={formData.external_link}
              onChange={handleChange('external_link')}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label htmlFor="logo">Logo (optionnel)</Label>
            <div className="mt-2">
              {logoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-32 h-32 object-contain border rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2"
                    onClick={handleRemoveLogo}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                    className="max-w-xs"
                  />
                  {isUploadingLogo && <Loader2 className="animate-spin" size={20} />}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Format recommandé : PNG ou SVG avec fond transparent. Max 2 Mo.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Définition</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Contenu (optionnel)</Label>
          <div className="mt-2">
            <EditorJSComponent
              value={formData.content}
              onChange={handleContentChange}
              placeholder="Ajoutez une définition ou description détaillée..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default LexiconEntryForm;


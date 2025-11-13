-- Migration: Création de la table lexicon_entries pour le système de lexique/acronymes

-- Créer la table lexicon_entries
CREATE TABLE IF NOT EXISTS public.lexicon_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    acronym TEXT,
    content JSONB,
    external_link TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_lexicon_entries_name ON public.lexicon_entries(name);
CREATE INDEX IF NOT EXISTS idx_lexicon_entries_acronym ON public.lexicon_entries(acronym) WHERE acronym IS NOT NULL;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_lexicon_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lexicon_entries_updated_at
    BEFORE UPDATE ON public.lexicon_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_lexicon_entries_updated_at();

-- Enable Row Level Security
ALTER TABLE public.lexicon_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire les entrées du lexique
CREATE POLICY "Lecture publique des entrées du lexique"
    ON public.lexicon_entries
    FOR SELECT
    USING (true);

-- Policy: Seuls les admins peuvent insérer
CREATE POLICY "Seuls les admins peuvent créer des entrées"
    ON public.lexicon_entries
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy: Seuls les admins peuvent mettre à jour
CREATE POLICY "Seuls les admins peuvent modifier des entrées"
    ON public.lexicon_entries
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy: Seuls les admins peuvent supprimer
CREATE POLICY "Seuls les admins peuvent supprimer des entrées"
    ON public.lexicon_entries
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE public.lexicon_entries IS 'Table contenant les entrées du lexique/dictionnaire d''acronymes';
COMMENT ON COLUMN public.lexicon_entries.name IS 'Nom complet du terme ou de l''entité';
COMMENT ON COLUMN public.lexicon_entries.acronym IS 'Acronyme optionnel du terme';
COMMENT ON COLUMN public.lexicon_entries.content IS 'Définition au format EditorJS (OutputData JSON)';
COMMENT ON COLUMN public.lexicon_entries.external_link IS 'Lien externe optionnel vers plus d''informations';
COMMENT ON COLUMN public.lexicon_entries.logo_url IS 'URL optionnelle du logo/image associé';


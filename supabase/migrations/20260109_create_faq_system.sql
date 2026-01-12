-- Migration: Création du système de FAQ
-- Crée les tables faqs, faq_categories et faq_items avec leurs relations

-- Table principale des FAQ
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des catégories dans une FAQ
CREATE TABLE IF NOT EXISTS public.faq_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faq_id UUID NOT NULL REFERENCES public.faqs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des questions/réponses dans une catégorie
CREATE TABLE IF NOT EXISTS public.faq_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faq_category_id UUID NOT NULL REFERENCES public.faq_categories(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'validated')),
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_faqs_slug ON public.faqs(slug);
CREATE INDEX IF NOT EXISTS idx_faq_categories_faq_id ON public.faq_categories(faq_id);
CREATE INDEX IF NOT EXISTS idx_faq_categories_position ON public.faq_categories(faq_id, position);
CREATE INDEX IF NOT EXISTS idx_faq_items_category_id ON public.faq_items(faq_category_id);
CREATE INDEX IF NOT EXISTS idx_faq_items_status ON public.faq_items(status);
CREATE INDEX IF NOT EXISTS idx_faq_items_position ON public.faq_items(faq_category_id, position);

-- Triggers pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_faq_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_faq_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_faqs_updated_at();

CREATE TRIGGER trigger_update_faq_categories_updated_at
    BEFORE UPDATE ON public.faq_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_faq_categories_updated_at();

CREATE TRIGGER trigger_update_faq_items_updated_at
    BEFORE UPDATE ON public.faq_items
    FOR EACH ROW
    EXECUTE FUNCTION update_faq_items_updated_at();

-- Enable Row Level Security
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Policies pour faqs: lecture publique, écriture admin uniquement
CREATE POLICY "Lecture publique des FAQ"
    ON public.faqs
    FOR SELECT
    USING (true);

CREATE POLICY "Seuls les admins peuvent créer des FAQ"
    ON public.faqs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Seuls les admins peuvent modifier des FAQ"
    ON public.faqs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Seuls les admins peuvent supprimer des FAQ"
    ON public.faqs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policies pour faq_categories: lecture publique, écriture admin uniquement
CREATE POLICY "Lecture publique des catégories FAQ"
    ON public.faq_categories
    FOR SELECT
    USING (true);

CREATE POLICY "Seuls les admins peuvent créer des catégories FAQ"
    ON public.faq_categories
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Seuls les admins peuvent modifier des catégories FAQ"
    ON public.faq_categories
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Seuls les admins peuvent supprimer des catégories FAQ"
    ON public.faq_categories
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policies pour faq_items: lecture publique, écriture admin uniquement
CREATE POLICY "Lecture publique des items FAQ"
    ON public.faq_items
    FOR SELECT
    USING (true);

CREATE POLICY "Seuls les admins peuvent créer des items FAQ"
    ON public.faq_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Seuls les admins peuvent modifier des items FAQ"
    ON public.faq_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Seuls les admins peuvent supprimer des items FAQ"
    ON public.faq_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Commentaires sur les tables
COMMENT ON TABLE public.faqs IS 'Table contenant les FAQ principales';
COMMENT ON TABLE public.faq_categories IS 'Table contenant les catégories dans une FAQ';
COMMENT ON TABLE public.faq_items IS 'Table contenant les questions/réponses dans une catégorie FAQ';

COMMENT ON COLUMN public.faqs.slug IS 'Slug unique pour identifier la FAQ dans l''URL';
COMMENT ON COLUMN public.faq_categories.icon IS 'Nom de l''icône lucide-react pour la catégorie';
COMMENT ON COLUMN public.faq_categories.position IS 'Position de la catégorie dans la FAQ (pour l''ordre)';
COMMENT ON COLUMN public.faq_items.question IS 'Question de la FAQ';
COMMENT ON COLUMN public.faq_items.answer IS 'Réponse au format EditorJS (OutputData JSON)';
COMMENT ON COLUMN public.faq_items.status IS 'Statut de l''item: draft (brouillon), pending (à valider), validated (validé)';
COMMENT ON COLUMN public.faq_items.position IS 'Position de l''item dans la catégorie (pour l''ordre)';



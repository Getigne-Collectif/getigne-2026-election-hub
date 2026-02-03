-- Migration: Module procuration (demandes et volontaires)
-- Tables: proxy_requests, proxy_matches
-- RGPD: pas de pièces d'identité, données minimales pour le matching

-- Table des demandes (mandants) et propositions (mandataires)
CREATE TABLE IF NOT EXISTS public.proxy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    type TEXT NOT NULL CHECK (type IN ('requester', 'volunteer')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    national_elector_number TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    voting_bureau SMALLINT CHECK (voting_bureau IN (1, 2, 3)),
    support_committee_consent BOOLEAN NOT NULL DEFAULT true,
    newsletter_consent BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched'))
);

CREATE INDEX IF NOT EXISTS idx_proxy_requests_type ON public.proxy_requests(type);
CREATE INDEX IF NOT EXISTS idx_proxy_requests_status ON public.proxy_requests(status);
CREATE INDEX IF NOT EXISTS idx_proxy_requests_created_at ON public.proxy_requests(created_at DESC);

-- Table des matchs (association mandant / mandataire)
CREATE TABLE IF NOT EXISTS public.proxy_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    requester_id UUID NOT NULL REFERENCES public.proxy_requests(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES public.proxy_requests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID REFERENCES auth.users(id),
    UNIQUE(requester_id),
    UNIQUE(volunteer_id),
    CHECK (requester_id != volunteer_id)
);

CREATE INDEX IF NOT EXISTS idx_proxy_matches_status ON public.proxy_matches(status);
CREATE INDEX IF NOT EXISTS idx_proxy_matches_requester ON public.proxy_matches(requester_id);
CREATE INDEX IF NOT EXISTS idx_proxy_matches_volunteer ON public.proxy_matches(volunteer_id);

-- RLS
ALTER TABLE public.proxy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proxy_matches ENABLE ROW LEVEL SECURITY;

-- proxy_requests: insertion publique (formulaires), lecture/modification admin
CREATE POLICY "Anyone can insert proxy_requests"
    ON public.proxy_requests FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can read proxy_requests"
    ON public.proxy_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update proxy_requests"
    ON public.proxy_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- proxy_matches: lecture/écriture admin uniquement
CREATE POLICY "Admins can read proxy_matches"
    ON public.proxy_matches FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert proxy_matches"
    ON public.proxy_matches FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update proxy_matches"
    ON public.proxy_matches FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete proxy_matches"
    ON public.proxy_matches FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Commentaire RGPD: rappel de la politique de conservation (à documenter côté admin)
COMMENT ON TABLE public.proxy_requests IS 'Demandes et propositions de procuration. Données conservées pour le matching uniquement (pas de pièces d''identité). Prévoir suppression après l''élection.';

-- Migration: Create External Directory System
-- Description: Tables pour gérer les contacts externes et les groupes/organisations
-- Date: 2026-01-13

-- 1. Créer la table external_groups
CREATE TABLE IF NOT EXISTS external_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    contact_email TEXT,
    city TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Créer la table external_contacts
CREATE TABLE IF NOT EXISTS external_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT,
    photo_url TEXT,
    email TEXT,
    phone TEXT,
    city TEXT,
    note TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Créer la table de liaison external_contact_groups
CREATE TABLE IF NOT EXISTS external_contact_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES external_contacts(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES external_groups(id) ON DELETE CASCADE,
    role TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(contact_id, group_id)
);

-- 4. Créer les indexes pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_external_contacts_first_name ON external_contacts(first_name);
CREATE INDEX IF NOT EXISTS idx_external_contacts_last_name ON external_contacts(last_name);
CREATE INDEX IF NOT EXISTS idx_external_contacts_city ON external_contacts(city);
CREATE INDEX IF NOT EXISTS idx_external_contacts_tags ON external_contacts USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_external_groups_name ON external_groups(name);
CREATE INDEX IF NOT EXISTS idx_external_groups_city ON external_groups(city);
CREATE INDEX IF NOT EXISTS idx_external_groups_tags ON external_groups USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_external_contact_groups_contact_id ON external_contact_groups(contact_id);
CREATE INDEX IF NOT EXISTS idx_external_contact_groups_group_id ON external_contact_groups(group_id);

-- 5. Créer les triggers pour updated_at
CREATE TRIGGER update_external_contacts_updated_at 
    BEFORE UPDATE ON external_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_groups_updated_at 
    BEFORE UPDATE ON external_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Activer Row Level Security (RLS)
ALTER TABLE external_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_contact_groups ENABLE ROW LEVEL SECURITY;

-- 7. Créer les policies RLS

-- Lecture publique pour tous
CREATE POLICY "Public read access for external_groups"
    ON external_groups FOR SELECT
    USING (true);

CREATE POLICY "Public read access for external_contacts"
    ON external_contacts FOR SELECT
    USING (true);

CREATE POLICY "Public read access for external_contact_groups"
    ON external_contact_groups FOR SELECT
    USING (true);

-- Modification réservée aux admins (vérification via user_roles)
CREATE POLICY "Admin can insert external_groups"
    ON external_groups FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin can update external_groups"
    ON external_groups FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin can delete external_groups"
    ON external_groups FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin can insert external_contacts"
    ON external_contacts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin can update external_contacts"
    ON external_contacts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin can delete external_contacts"
    ON external_contacts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin can insert external_contact_groups"
    ON external_contact_groups FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin can update external_contact_groups"
    ON external_contact_groups FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin can delete external_contact_groups"
    ON external_contact_groups FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- 8. Ajouter des commentaires pour la documentation
COMMENT ON TABLE external_groups IS 'Groupes, organisations, associations et clubs externes';
COMMENT ON TABLE external_contacts IS 'Contacts individuels externes (personnes ressources, partenaires)';
COMMENT ON TABLE external_contact_groups IS 'Table de liaison many-to-many entre contacts et groupes';

COMMENT ON COLUMN external_groups.name IS 'Nom du groupe/organisation';
COMMENT ON COLUMN external_groups.logo_url IS 'URL du logo du groupe';
COMMENT ON COLUMN external_groups.description IS 'Description du groupe et de ses activités';
COMMENT ON COLUMN external_groups.contact_email IS 'Email de contact du groupe';
COMMENT ON COLUMN external_groups.city IS 'Ville/commune du groupe';
COMMENT ON COLUMN external_groups.tags IS 'Étiquettes libres pour catégoriser le groupe';

COMMENT ON COLUMN external_contacts.first_name IS 'Prénom du contact (requis)';
COMMENT ON COLUMN external_contacts.last_name IS 'Nom de famille du contact (optionnel)';
COMMENT ON COLUMN external_contacts.photo_url IS 'URL de la photo du contact';
COMMENT ON COLUMN external_contacts.email IS 'Adresse email du contact';
COMMENT ON COLUMN external_contacts.phone IS 'Numéro de téléphone du contact';
COMMENT ON COLUMN external_contacts.city IS 'Ville/commune du contact';
COMMENT ON COLUMN external_contacts.note IS 'Notes et informations supplémentaires sur le contact';
COMMENT ON COLUMN external_contacts.tags IS 'Étiquettes libres pour catégoriser le contact';

COMMENT ON COLUMN external_contact_groups.contact_id IS 'ID du contact';
COMMENT ON COLUMN external_contact_groups.group_id IS 'ID du groupe';
COMMENT ON COLUMN external_contact_groups.role IS 'Rôle du contact dans le groupe (ex: Président, Trésorier)';

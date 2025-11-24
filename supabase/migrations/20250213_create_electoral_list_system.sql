-- Migration: Système de liste électorale pour les élections municipales 2026
-- Description: Crée les tables pour gérer les membres de l'équipe, les rôles thématiques et la composition de la liste électorale

-- 1. Créer la table thematic_roles
CREATE TABLE IF NOT EXISTS thematic_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT, -- Couleur hexadécimale pour l'affichage
    icon TEXT, -- Nom de l'icône lucide-react
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Créer la table electoral_list
CREATE TABLE IF NOT EXISTS electoral_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    election_date DATE NOT NULL,
    governance_content JSONB, -- Contenu EditorJS pour la section gouvernance
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Altérer la table team_members pour ajouter les nouveaux champs
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- 4. Créer la table electoral_list_members
CREATE TABLE IF NOT EXISTS electoral_list_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    electoral_list_id UUID NOT NULL REFERENCES electoral_list(id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position >= 1 AND position <= 29),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(electoral_list_id, team_member_id), -- Un membre ne peut être qu'une fois dans une liste
    UNIQUE(electoral_list_id, position) -- Une position ne peut avoir qu'un membre
);

-- 5. Créer la table electoral_member_roles
CREATE TABLE IF NOT EXISTS electoral_member_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    electoral_list_member_id UUID NOT NULL REFERENCES electoral_list_members(id) ON DELETE CASCADE,
    thematic_role_id UUID NOT NULL REFERENCES thematic_roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(electoral_list_member_id, thematic_role_id) -- Un membre ne peut avoir le même rôle qu'une fois
);

-- 6. Créer les indexes
CREATE INDEX IF NOT EXISTS idx_thematic_roles_sort_order ON thematic_roles(sort_order);
CREATE INDEX IF NOT EXISTS idx_electoral_list_is_active ON electoral_list(is_active);
CREATE INDEX IF NOT EXISTS idx_electoral_list_members_list_id ON electoral_list_members(electoral_list_id);
CREATE INDEX IF NOT EXISTS idx_electoral_list_members_position ON electoral_list_members(electoral_list_id, position);
CREATE INDEX IF NOT EXISTS idx_electoral_member_roles_list_member_id ON electoral_member_roles(electoral_list_member_id);

-- 7. Créer les triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_thematic_roles_updated_at BEFORE UPDATE ON thematic_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_electoral_list_updated_at BEFORE UPDATE ON electoral_list
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_electoral_list_members_updated_at BEFORE UPDATE ON electoral_list_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Trigger pour s'assurer qu'une seule liste est active
CREATE OR REPLACE FUNCTION ensure_single_active_electoral_list()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        UPDATE electoral_list
        SET is_active = false
        WHERE id != NEW.id AND is_active = true;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_active_list BEFORE INSERT OR UPDATE ON electoral_list
    FOR EACH ROW EXECUTE FUNCTION ensure_single_active_electoral_list();

-- 9. RLS Policies

-- thematic_roles: lecture publique, modification admin
ALTER TABLE thematic_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Thematic roles are viewable by everyone"
    ON thematic_roles FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Thematic roles are editable by admins"
    ON thematic_roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- electoral_list: lecture publique (seulement liste active), modification admin
ALTER TABLE electoral_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active electoral list is viewable by everyone"
    ON electoral_list FOR SELECT
    TO authenticated, anon
    USING (is_active = true);

CREATE POLICY "Electoral lists are viewable by admins"
    ON electoral_list FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Electoral lists are editable by admins"
    ON electoral_list FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- electoral_list_members: lecture publique (via liste active), modification admin
ALTER TABLE electoral_list_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Electoral list members are viewable by everyone"
    ON electoral_list_members FOR SELECT
    TO authenticated, anon
    USING (
        EXISTS (
            SELECT 1 FROM electoral_list
            WHERE electoral_list.id = electoral_list_members.electoral_list_id
            AND electoral_list.is_active = true
        )
    );

CREATE POLICY "Electoral list members are viewable by admins"
    ON electoral_list_members FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Electoral list members are editable by admins"
    ON electoral_list_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- electoral_member_roles: lecture publique (via liste active), modification admin
ALTER TABLE electoral_member_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Electoral member roles are viewable by everyone"
    ON electoral_member_roles FOR SELECT
    TO authenticated, anon
    USING (
        EXISTS (
            SELECT 1 FROM electoral_list_members
            JOIN electoral_list ON electoral_list.id = electoral_list_members.electoral_list_id
            WHERE electoral_list_members.id = electoral_member_roles.electoral_list_member_id
            AND electoral_list.is_active = true
        )
    );

CREATE POLICY "Electoral member roles are viewable by admins"
    ON electoral_member_roles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Electoral member roles are editable by admins"
    ON electoral_member_roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- 10. Insérer des rôles thématiques par défaut
INSERT INTO thematic_roles (name, description, color, icon, sort_order) VALUES
    ('Urbanisme', 'Aménagement du territoire, logement, mobilité', '#3B82F6', 'Building2', 1),
    ('Enfance et Jeunesse', 'Éducation, petite enfance, jeunesse', '#EC4899', 'Baby', 2),
    ('Participation citoyenne', 'Démocratie locale, consultation, engagement', '#8B5CF6', 'Users', 3),
    ('Transparence démocratique', 'Information, open data, reddition de comptes', '#06B6D4', 'Eye', 4),
    ('Culture', 'Vie culturelle, patrimoine, événements', '#F59E0B', 'Palette', 5),
    ('Sports et loisirs', 'Équipements sportifs, associations, loisirs', '#10B981', 'Dumbbell', 6),
    ('Environnement', 'Transition écologique, biodiversité, énergie', '#22C55E', 'Leaf', 7),
    ('Solidarité', 'Action sociale, inclusion, entraide', '#EF4444', 'Heart', 8),
    ('Économie locale', 'Commerce de proximité, emploi, entrepreneuriat', '#F97316', 'ShoppingBag', 9),
    ('Finances', 'Budget, fiscalité, investissements', '#6366F1', 'Euro', 10),
    ('Services publics', 'État civil, services administratifs, proximité', '#14B8A6', 'Building', 11),
    ('Sécurité', 'Prévention, sécurité routière, tranquillité', '#DC2626', 'Shield', 12);

-- 11. Créer une liste électorale par défaut
INSERT INTO electoral_list (title, description, election_date, is_active, governance_content) VALUES
    (
        'Liste Gétigné Collectif - Mars 2026',
        'Liste citoyenne et participative pour les élections municipales de Gétigné',
        '2026-03-15',
        true,
        '{"time": 1644836400000, "blocks": [{"id": "block1", "type": "header", "data": {"text": "Une gouvernance partagée", "level": 2}}, {"id": "block2", "type": "paragraph", "data": {"text": "Notre collectif fonctionne selon les principes de la démocratie participative et de la transparence totale."}}], "version": "2.28.0"}'
    );

-- Commentaire pour la régénération des types
COMMENT ON TABLE thematic_roles IS 'Rôles thématiques pour les membres de la liste électorale';
COMMENT ON TABLE electoral_list IS 'Listes électorales municipales';
COMMENT ON TABLE electoral_list_members IS 'Association entre membres d''équipe et positions sur la liste électorale';
COMMENT ON TABLE electoral_member_roles IS 'Rôles thématiques assignés aux membres de la liste électorale';








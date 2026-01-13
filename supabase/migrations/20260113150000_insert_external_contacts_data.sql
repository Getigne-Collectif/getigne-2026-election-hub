-- Migration pour importer les contacts externes depuis le CSV
-- Cette migration insère tous les groupes, contacts et leurs liaisons

-- Insertion des groupes (associations)
INSERT INTO external_groups (name, city, tags) VALUES
  ('A.S.B.G.B. Basket Gétigné', 'Gétigné', ARRAY['SPORT']),
  ('Animation sportive départementale (A.S.D)', 'Gétigné', ARRAY['SPORT']),
  ('F.C.G.B. Football Club Gétigné Boussay', 'Gétigné', ARRAY['SPORT']),
  ('D.E.T.E.N.T.E.S - Equitation', 'Gétigné', ARRAY['SPORT']),
  ('Gétigné Canoë Kayak', 'Gétigné', ARRAY['SPORT']),
  ('Judo Club Gétignois', 'Gétigné', ARRAY['SPORT']),
  ('Le Palet Gétignois', 'Gétigné', ARRAY['SPORT']),
  ('OISL - Office Intercommunal des Sports et des Loisirs', 'Gétigné', ARRAY['SPORT']),
  ('Stretching postural - Vivre à la verticale', 'Gétigné', ARRAY['SPORT']),
  ('Tennis Clisson Gétigné', 'Gétigné', ARRAY['SPORT']),
  ('Twirling Bâton', 'Gétigné', ARRAY['SPORT']),
  ('Union des deux rives', 'Gétigné', ARRAY['SPORT']),
  ('Vélo Loisirs de l''étang', 'Gétigné', ARRAY['SPORT']),
  ('Vieng Muay Thai Gétignois', 'Gétigné', ARRAY['SPORT']),
  ('Amicale Bouliste de Gétigné', 'Gétigné', ARRAY['SPORT']),
  ('RC Darons', 'Gétigné', ARRAY['SPORT']),
  ('Chavir''les Cœurs', 'Gétigné', ARRAY['SPORT']),
  ('Géti Gym', 'Gétigné', ARRAY['SPORT']),
  ('APEEC', 'Gétigné', ARRAY['EDUCATION']),
  ('APPEL', 'Gétigné', ARRAY['EDUCATION']),
  ('OGEC', 'Gétigné', ARRAY['EDUCATION']),
  ('ADMR Clisson-Val de Sèvre', 'Gétigné', ARRAY['SERVICES']),
  ('CLCV', 'Gétigné', ARRAY['SERVICES']),
  ('AVF Région de Clisson', 'Gétigné', ARRAY['SERVICES']),
  ('MAM Rêve et Ritournelle', 'Gétigné', ARRAY['SERVICES']),
  ('Femmes en détresse - Maison des femmes', 'Gétigné', ARRAY['SERVICES']),
  ('Les amis du Moulins Neufs', 'Gétigné', ARRAY['SERVICES']),
  ('ANIMAJE - Espace de loisirs', 'Gétigné', ARRAY['ANIMATIONS']),
  ('Festi Get', 'Gétigné', ARRAY['ANIMATIONS']),
  ('Des rêves de Rives', 'Gétigné', ARRAY['ANIMATIONS']),
  ('Haute Gente en fête', 'Gétigné', ARRAY['ANIMATIONS']),
  ('Chorale du Val de Sèvre', 'Gétigné', ARRAY['MUSIQUE & CHANTS']),
  ('FURCI''ART', 'Gétigné', ARRAY['MUSIQUE & CHANTS']),
  ('Les jeunes de Notre-Dame de Toutes-Joies', 'Gétigné', ARRAY['MUSIQUE & CHANTS']),
  ('Soufflerie Cluricaunic', 'Gétigné', ARRAY['MUSIQUE & CHANTS']),
  ('Association du Clos des Changes', 'Gétigné', ARRAY['ASSOCIATIONS DE QUARTIERS']),
  ('Les Sitelles', 'Gétigné', ARRAY['ASSOCIATIONS DE QUARTIERS']),
  ('Les copains d''abord de Gétigné', 'Gétigné', ARRAY['ASSOCIATIONS DE QUARTIERS']),
  ('Club d''aéromodélisme gétignois', 'Gétigné', ARRAY['ASSOCIATIONS DIVERSES']),
  ('Club d''échecs', 'Gétigné', ARRAY['ASSOCIATIONS DIVERSES']),
  ('Club Gétignois de l''Amitié', 'Gétigné', ARRAY['ASSOCIATIONS DIVERSES']),
  ('Images et Créations Gétigné - Val de Clisson', 'Gétigné', ARRAY['ASSOCIATIONS DIVERSES']),
  ('Théâtre Amateur Gétignois (TAG)', 'Gétigné', ARRAY['ASSOCIATIONS DIVERSES']),
  ('Don du sang Gétigné', 'Gétigné', ARRAY['ASSOCIATIONS DIVERSES']),
  ('UNC - Union Nationale des Anciens Combattant', 'Gétigné', ARRAY['AINÉS']);

-- Insertion des contacts et leurs liaisons
-- SPORT
DO $$
DECLARE
  v_group_id uuid;
  v_contact_id uuid;
BEGIN
  -- A.S.B.G.B. Basket Gétigné
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'A.S.B.G.B. Basket Gétigné';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Emeline', 'BARON', '06 16 80 75 23', 'presidentasbgb@gmail.com', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Animation sportive départementale
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Animation sportive départementale (A.S.D)';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Sébastien', 'LE PAUTREMAT', '06.86.45.82.43', 'sebastien.lepautremat@loire-atlantique.fr', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- F.C.G.B. Football
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'F.C.G.B. Football Club Gétigné Boussay';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Gael', 'MORISSEAU', NULL, 'fcgetigneboussay@gmail.com', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'vice-président');

  -- D.E.T.E.N.T.E.S - Equitation
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'D.E.T.E.N.T.E.S - Equitation';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Sandrine', 'PICARD', '06 17 09 24 95', 'sanlou44@orange.fr', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Gétigné Canoë Kayak
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Gétigné Canoë Kayak';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Pierre', 'MARTIN', '06 71 58 06 83', 'canoekayakgetigne@gmail.com', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'président');

  -- Judo Club Gétignois
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Judo Club Gétignois';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Corentin', 'CHAPELET', '07 83 52 48 01', 'judoclubgetignois@yahoo.fr', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Le Palet Gétignois
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Le Palet Gétignois';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Anthony', 'GARCIA', '07 80 47 38 61', 'paletsgetignois@gmail.com', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- OISL
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'OISL - Office Intercommunal des Sports et des Loisirs';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Christine', 'MARSEILLE', '06 06 42 41 92', 'oisl.valleedeclisson@gmail.com', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Stretching postural
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Stretching postural - Vivre à la verticale';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Huguette', 'FLEURANCE FAUQUE', '06 79 67 53 34', 'stretchingetigne@gmail.com', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'présidente');

  -- Tennis Clisson Gétigné
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Tennis Clisson Gétigné';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Olivier', 'CHARRUAU', '06.74.44.43.77', 'tcg44190@gmail.com', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Twirling Bâton
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Twirling Bâton';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Mélanie', 'CAILLAUD', '06.68.08.38.76', 'caillaud_m@yahoo.fr', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Union des deux rives
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Union des deux rives';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Joseph', 'BRAUD', '06.22.25.75.69', 'cugand@federation-peche-vendee.fr', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Vélo Loisirs de l'étang
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Vélo Loisirs de l''étang';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('André', 'VINET', '07.80.59.91.25', 'vinetandre@yahoo.fr', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Vieng Muay Thai Gétignois
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Vieng Muay Thai Gétignois';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Vieng', 'PhimPhavong', '07 50 90 80 40', 'boxethaigetigne@yahoo.fr', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Amicale Bouliste de Gétigné
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Amicale Bouliste de Gétigné';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('André', 'GODIER', NULL, 'dede.godier@wanadoo.fr', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- RC Darons
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'RC Darons';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('César', 'PÉTRIEUX', '06 59 57 34 66', 'cesar.petrieux91@gmail.com', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'secrétaire');

  -- Chavir'les Cœurs
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Chavir''les Cœurs';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Virginie', 'Peltier', '07 80 33 26 71', 'chavirlescoeurs@gmail.com', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'présidente');

  -- Géti Gym
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Géti Gym';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Marie-Renée', 'Bouteiller', '02.40.03.92.81', 'mbouteiller48@gmail.com', 'Gétigné', ARRAY['SPORT'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- EDUCATION
  -- APEEC
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'APEEC';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Elise', 'SOULLARD', NULL, 'apeec44@gmail.fr', 'Gétigné', ARRAY['EDUCATION'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'présidente');

  -- APPEL
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'APPEL';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Marie', 'Loizeau', '06 21 49 10 26', 'apel.getigne@gmail.com', 'Gétigné', ARRAY['EDUCATION'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'Présidente');

  -- OGEC
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'OGEC';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Noémie', 'METREAU', '02 40 54 03 40', NULL, 'Gétigné', ARRAY['EDUCATION'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'présidente');

  -- SERVICES
  -- ADMR
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'ADMR Clisson-Val de Sèvre';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Claudine', 'Jamin', '02 40 54 84 45', 'paysduvignoble@fede44.admr.org', 'Gétigné', ARRAY['SERVICES'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'Responsable de l''asso pour Gétigné');

  -- CLCV
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'CLCV';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Marie-Pierre', 'Rochais', '02 85 52 62 16', NULL, 'Gétigné', ARRAY['SERVICES'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'Présidente');

  -- AVF
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'AVF Région de Clisson';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Monique', 'Paludet', '07 66 28 53 00', 'avf.clisson@gmx.fr', 'Gétigné', ARRAY['SERVICES'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'Présidente');

  -- MAM Rêve et Ritournelle - pas de contact nominatif
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'MAM Rêve et Ritournelle';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Contact', 'MAM', '02 55 09 00 93', 'reveetritournelle@gmail.com', 'Gétigné', ARRAY['SERVICES'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Femmes en détresse
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Femmes en détresse - Maison des femmes';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Caty', 'Bouleau', '06 20 58 46 32', 'femmesendetresseclisson@gmail.com', 'Gétigné', ARRAY['SERVICES'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'Présidente');

  -- Les amis du Moulins Neufs - contacts multiples
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Les amis du Moulins Neufs';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Angélique', 'GROLLIER', '06 78 70 33 58', NULL, 'Gétigné', ARRAY['SERVICES'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);
  
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Yann', 'PELLEMELE', NULL, NULL, 'Gétigné', ARRAY['SERVICES'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);
  
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Sylvie', 'Favreau Cortina', NULL, NULL, 'Gétigné', ARRAY['SERVICES'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- ANIMATIONS
  -- ANIMAJE
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'ANIMAJE - Espace de loisirs';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Frédéric', 'Guillaume', '07 60 56 22 11', 'animajegetigne@gmail.com', 'Gétigné', ARRAY['ANIMATIONS'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Festi Get
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Festi Get';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Patrick', 'de Brut', NULL, 'festiget44@gmail.com', 'Gétigné', ARRAY['ANIMATIONS'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Des rêves de Rives
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Des rêves de Rives';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Marie', 'Cap', NULL, 'assodesrevesderives@gmail.com', 'Gétigné', ARRAY['ANIMATIONS'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Haute Gente en fête
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Haute Gente en fête';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Stéphane', 'Piveteau', '09 50 21 10 55', NULL, 'Gétigné', ARRAY['ANIMATIONS'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- MUSIQUE & CHANTS
  -- Chorale du Val de Sèvre
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Chorale du Val de Sèvre';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Clarisse', 'Bouet', '06 02 35 61 57', 'cgncv.bouet@orange.fr', 'Gétigné', ARRAY['MUSIQUE & CHANTS'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- FURCI'ART
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'FURCI''ART';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Mickaël', 'HERVÉ', '06.59.25.11.92', 'furciart1802@gmail.com', 'Gétigné', ARRAY['MUSIQUE & CHANTS'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'président');

  -- Les jeunes de Notre-Dame de Toutes-Joies
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Les jeunes de Notre-Dame de Toutes-Joies';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('René', 'Lesieur', '06 88 13 63 02', 'rene.lesieur@wanadoo.fr', 'Gétigné', ARRAY['MUSIQUE & CHANTS'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'Président');

  -- Soufflerie Cluricaunic
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Soufflerie Cluricaunic';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Vincent', 'Lelièvre', '06 26 91 09 29', 'cluricaune@hotmail.fr', 'Gétigné', ARRAY['MUSIQUE & CHANTS'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'Professeur');

  -- ASSOCIATIONS DE QUARTIERS
  -- Association du Clos des Changes
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Association du Clos des Changes';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Brigitte', 'BOSSARD-FRANCOIS', '06 33 83 60 47', 'cleflodi@orange.fr', 'Gétigné', ARRAY['ASSOCIATIONS DE QUARTIERS'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Les Sitelles
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Les Sitelles';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Audrey', 'Lavalette', NULL, 'assodessittelles@gmail.com', 'Gétigné', ARRAY['ASSOCIATIONS DE QUARTIERS'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Les copains d'abord de Gétigné
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Les copains d''abord de Gétigné';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Annabelle', 'Champain', NULL, 'lescopainsdabord44190@hotmail.com', 'Gétigné', ARRAY['ASSOCIATIONS DE QUARTIERS'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'co-présidente');
  
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Lény', 'Bernard', NULL, NULL, 'Gétigné', ARRAY['ASSOCIATIONS DE QUARTIERS'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'co-président');

  -- ASSOCIATIONS DIVERSES
  -- Club d'aéromodélisme gétignois
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Club d''aéromodélisme gétignois';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Bertrand', 'BARRÉ', '06 15 46 02 46', 'barre.bertrand@orange.fr', 'Gétigné', ARRAY['ASSOCIATIONS DIVERSES'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Club d'échecs
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Club d''échecs';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Stéphanie', 'DROUET', '07.80.52.77.91', 'stephd44190@orange.fr', 'Gétigné', ARRAY['ASSOCIATIONS DIVERSES'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Club Gétignois de l'Amitié
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Club Gétignois de l''Amitié';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Albert', 'CORMIER', '02 40 36 16 30', NULL, 'Gétigné', ARRAY['ASSOCIATIONS DIVERSES'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'Président');

  -- Images et Créations Gétigné - Val de Clisson
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Images et Créations Gétigné - Val de Clisson';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Pascal', 'BANSE', '06 48 28 33 97', 'pascal.banse@orange.fr', 'Gétigné', ARRAY['ASSOCIATIONS DIVERSES'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Théâtre Amateur Gétignois (TAG)
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Théâtre Amateur Gétignois (TAG)';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Laëtitia', 'Lorieau', '06 89 64 03 77', 'theatreamateurgetignois.44@gmail.com', 'Gétigné', ARRAY['ASSOCIATIONS DIVERSES'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, NULL);

  -- Don du sang Gétigné
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'Don du sang Gétigné';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('Agnès', 'GRANDIN', '06 33 46 97 59', NULL, 'Gétigné', ARRAY['ASSOCIATIONS DIVERSES'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'présidente');

  -- AINÉS
  -- UNC - Union Nationale des Anciens Combattant
  SELECT id INTO v_group_id FROM external_groups WHERE name = 'UNC - Union Nationale des Anciens Combattant';
  INSERT INTO external_contacts (first_name, last_name, phone, email, city, tags)
  VALUES ('René', 'Thomas', '06 30 05 53 03', 'renethomas44@orange.fr', 'Gétigné', ARRAY['AINÉS'])
  RETURNING id INTO v_contact_id;
  INSERT INTO external_contact_groups (contact_id, group_id, role) VALUES (v_contact_id, v_group_id, 'Secrétaire');

END $$;

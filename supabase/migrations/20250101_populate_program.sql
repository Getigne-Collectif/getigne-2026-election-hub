-- Insertion du contenu général du programme
INSERT INTO public.program_general (content) VALUES (
'# Programme Électoral - Gétigné Collectif

Notre programme s''articule autour de 5 axes principaux, avec l''écologie et la démocratie comme fil conducteur transversal.

## Les 5 axes prioritaires :

1. **VIE LOCALE** - Soutien à la vie associative, culture, sport, environnement
2. **AMÉNAGEMENT** - Énergie, mobilité, cœur de bourg, biodiversité
3. **ENFANCE JEUNESSE ÉDUCATION** - Accueils de loisirs, restauration scolaire, accompagnement
4. **ÉCONOMIE LOCALE** - Agriculture, commerces, entreprises, Biocat
5. **ALIMENTATION / SANTÉ** - Marchés bio, jardins partagés, cantine scolaire

## Les grands projets pour Gétigné :
- Complexe sportif
- Centre socio-culturel  
- Ferme/cantine en régie municipale

*Programme élaboré collectivement par les citoyens de Gétigné*'
);

-- Insertion des sections thématiques (program_items)
INSERT INTO public.program_items (title, description, icon, position) VALUES
('VIE LOCALE', 'Soutien à la vie associative, culture, sport, environnement et politique sociale', 'users', 1),
('AMÉNAGEMENT', 'Énergie, mobilité, cœur de bourg, biodiversité et cycle de l''eau', 'home', 2),
('MOBILITÉ', 'Déplacements doux, transports en commun et mobilité durable', 'bike', 3),
('ENFANCE JEUNESSE ÉDUCATION', 'Accueils de loisirs, restauration scolaire, accompagnement et parentalité', 'graduation-cap', 4),
('SOCIAL (CCAS)', 'Action sociale, solidarité et accompagnement des publics fragiles', 'heart', 5),
('PETITE ENFANCE', 'Crèche, LAEP et garde d''enfants', 'baby', 6),
('ALIMENTATION', 'Marchés bio, jardins partagés et ferme municipale', 'apple', 7),
('ÉCONOMIE LOCALE', 'Agriculture, commerces, entreprises et Biocat', 'building', 8),
('AGRICULTURE', 'Installation de jeunes agriculteurs et coopératives locales', 'leaf', 9),
('ALIMENTATION / SANTÉ', 'Programmes d''éducation alimentaire et cantine scolaire', 'utensils', 10);

-- Insertion des points du programme (program_points)
-- VIE LOCALE
INSERT INTO public.program_points (title, content, position, program_item_id) VALUES
('Être le partenaire de la vie associative', 'Nous soutiendrons la vie associative par : un meilleur accès aux infrastructures, une amélioration des équipements, des appels à projet et une aide à l''accessibilité', 1, (SELECT id FROM public.program_items WHERE title = 'VIE LOCALE')),
('La culture pour rassembler', 'Nous mènerons une véritable politique culturelle, ambitieuse, innovante à la hauteur des attentes du public, des talents du Vignoble et des enjeux du vivre ensemble.', 2, (SELECT id FROM public.program_items WHERE title = 'VIE LOCALE')),
('Sport pour tous', 'Tout en respectant leur vie fédérale, nous fédérerons les associations sportives autour d''actions inclusives et participant au bien-être des habitants quel que soit leur âge. Nous améliorerons les conditions d''accueil et de pratique.', 3, (SELECT id FROM public.program_items WHERE title = 'VIE LOCALE')),
('L''environnement : un secteur à développer aussi dans le secteur associatif', 'Nous souhaitons soutenir l''émergence de projets associatifs ayant pour objet toute action contribuant à lutter contre le changement climatique, sensibiliser les citoyens aux enjeux de la biodiversité et à rendre notre territoire plus résilient face au changement climatique.', 4, (SELECT id FROM public.program_items WHERE title = 'VIE LOCALE')),
('Des « plans » pour conduire avec les acteurs associatifs des actions d''intérêt général', 'Nous lancerons une série d''appels à projet invitant les associations à mobiliser leurs compétences pour le bien commun. Ces plans s''inscriront dans les champs de l''éducation, de la santé, du lien intergénérationnel et de la parentalité.', 5, (SELECT id FROM public.program_items WHERE title = 'VIE LOCALE')),
('Une véritable politique sociale', 'Nous inscrivons au fronton de nos mairie le mot égalité entre la liberté et la fraternité. Il s''agit donc d''être à la hauteur des valeurs historiques de notre république.', 6, (SELECT id FROM public.program_items WHERE title = 'VIE LOCALE')),
('Un centre socioculturel pour Gétigné', 'Nous accompagnerons l''association « Les Copains d''Abord » dans la création d''un centre socioculturel. Bâtiment du périscolaire pour faire le centre socio-culturel ? Et garder Bellevue pour programmation culturelle. Sujet du terrain de foot et équipements sportifs à déplacer : option renaturation/déplacement ou réaménagement de l''existant.', 7, (SELECT id FROM public.program_items WHERE title = 'VIE LOCALE'));

-- AMÉNAGEMENT
INSERT INTO public.program_points (title, content, position, program_item_id) VALUES
('Améliorer le cadre de vie', 'Structurer le paysage et anticiper l''impact du changement climatique, réduire les îlots de chaleur en cas de canicule et donc améliorer le confort des habitants (notamment en milieu scolaire)', 1, (SELECT id FROM public.program_items WHERE title = 'AMÉNAGEMENT')),
('Améliorer la biodiversité', 'Offrir aux espèces végétales et animales plus d''espaces pour se maintenir et/ou se développer', 2, (SELECT id FROM public.program_items WHERE title = 'AMÉNAGEMENT')),
('Améliorer le cycle de l''eau et sa qualité', 'Faciliter l''infiltration des eaux de pluies, réduire les pollutions allant dans la Sèvre. Mesures concrètes à rajouter', 3, (SELECT id FROM public.program_items WHERE title = 'AMÉNAGEMENT'));

-- MOBILITÉ
INSERT INTO public.program_points (title, content, position, program_item_id) VALUES
('Encourager les déplacements doux', 'Création de liaisons douces dans le bourg de Gétigné et avec les villages, création d''abris pour les vélos et poussettes aux endroits stratégiques (exemple : au niveau des écoles, des arrêts navette), création d''une liaison cyclable directe et sécurisée entre Gétigné et la gare de Clisson', 1, (SELECT id FROM public.program_items WHERE title = 'MOBILITÉ')),
('Encourager l''utilisation régulière de transport en commun', 'Navette, covoiturage - réseau pouce', 2, (SELECT id FROM public.program_items WHERE title = 'MOBILITÉ')),
('Mettre en place une aide pour l''entretien des vélos', 'Sur présentation facture entretien/revenus modestes', 3, (SELECT id FROM public.program_items WHERE title = 'MOBILITÉ')),
('Aide achat vélos', 'Au niveau de l''agglo ?', 4, (SELECT id FROM public.program_items WHERE title = 'MOBILITÉ')),
('Espace associatif / collaboratif de réparation vélos', 'Soutenir ?', 5, (SELECT id FROM public.program_items WHERE title = 'MOBILITÉ'));

-- ENFANCE JEUNESSE ÉDUCATION
INSERT INTO public.program_points (title, content, position, program_item_id) VALUES
('Créer un conseil de jeunes de Gétigné', 'Pour impliquer les ados dans la vie de la commune et l''organisation d''événements. A préciser pour ne pas confondre avec l''existant', 1, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Proposer des stages thématiques', 'Nature, arts, sport, numérique… en lien avec les associations locales ou des entreprises locales pour une ouverture vers des stages de troisième.', 2, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Pérennisation des équipes d''animation', 'CDI, temps plein pour stabiliser le lien éducatif avec les enfants', 3, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Valorisation du rôle d''animateurs', 'Dans le projet éducatif local, créer des synergies avec les écoles et valoriser les salaires des animateurs pour fidéliser les salariés', 4, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Formation continue des encadrants et animateurs', 'Sur l''accueil de loisir sur des thématiques importantes : écologie, pédagogie inclusive, gestion des émotions', 5, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Synergies entre les projets pédagogiques', 'École et accueil de loisirs: ex jardin partagé, expositions, projet théâtre', 6, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Partenariats locaux pour faciliter la mobilité', 'Navettes pour des activités sur d''autres communes avoisinantes', 7, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Groupe de pilotage éducatif local', 'Composé par: enseignants, élus, jeunes et parents. A intégrer dans le PEDT', 8, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION'));

-- Restauration scolaire
INSERT INTO public.program_points (title, content, position, program_item_id) VALUES
('Objectif de 80% bio et local', 'Dans les repas en coopération avec les producteurs de la commune (IO CAT) et des territoires voisins', 9, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Deux jours de menus végétariens', 'Au sein de la cantine. Une offre sans viande à chaque repas. Voir la question du gâchis. Voir comment on l''affiche', 10, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Accompagnement par les pieds dans le plat', 'Afin de pouvoir atteindre une alimentation 100% local et bio à horizons 2027 un an après l''élection du collectif. A ajuster selon fin du marché', 11, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Système de compostage et antigaspillage', 'En sensibilisant les enfants et essayer de faire du réemploi des excédents', 12, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Ateliers avec les producteurs locaux', 'Et des animations cuisine puis créer un "pacte local ou engagement local avec les producteurs pour assurer les approvisionnements"', 13, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Bilan annuel public sur la restauration scolaire', 'Qualité, origine des produits, retours des enfants et familles', 14, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Formation continue des agents', 'Sur la cuisine bio et locale ainsi que la gestion des déchets et les allergies', 15, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION'));

-- Accompagnement à la scolarité et parentalité
INSERT INTO public.program_points (title, content, position, program_item_id) VALUES
('Organisation de café parents', 'Et d''autres types d''activité', 16, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Cartographie des ressources', 'Avec les équipes éducatives et les familles', 17, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Dispositif d''aide aux devoirs', 'Existe t-il une CLAS à Gétigné ?', 18, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Sensibilisation des animateurs aux troubles de l''apprentissage', 'Ex (DYS, TDAH, TSA…)', 19, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION'));

-- Périscolaire et ALSH
INSERT INTO public.program_points (title, content, position, program_item_id) VALUES
('Service accessible à toutes les familles', 'Quels que soient leurs horaires et revenus', 20, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Accueil des enfants en situation de handicap', 'Avec les moyens humains adaptés, en lien avec les AVS/AESH (partager plan handicap Accoord)', 21, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Invitation des parents volontaires', 'À venir partager un savoir-faire ou autre une fois par trimestre (ex : conte, art, jeux coopératifs, musique instruments...)', 22, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Développer les actions intergénérationnelles', '', 23, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Conseil d''enfants pour le périscolaire', 'Pour proposer leurs idées, participer aux choix des jeux et matériels achetés', 24, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Conventions partenariales avec les associations sportives', 'De Gétigné pour des initiations sur les temps périscolaires si possible', 25, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION')),
('Transformer le repas des "aînés"', 'En repas rencontre intergénérationnel avec les familles avec des revenus modestes et des aînés plus des activités proposées par le club de jeunes', 26, (SELECT id FROM public.program_items WHERE title = 'ENFANCE JEUNESSE ÉDUCATION'));

-- SOCIAL (CCAS)
INSERT INTO public.program_points (title, content, position, program_item_id) VALUES
('Rendre le CCAS plus visible et accessible', 'Aux gétignois-es', 1, (SELECT id FROM public.program_items WHERE title = 'SOCIAL (CCAS)')),
('Projet d''Epi en lien avec le CCAS', 'Et les publics isolés > distinguer épicerie solidaire vs Epi', 2, (SELECT id FROM public.program_items WHERE title = 'SOCIAL (CCAS)')),
('Création d''un réseau de bénévoles relais', 'Sur les différents quartiers en les formant', 3, (SELECT id FROM public.program_items WHERE title = 'SOCIAL (CCAS)')),
('PASS culture', '', 4, (SELECT id FROM public.program_items WHERE title = 'SOCIAL (CCAS)')),
('Temps d''écoute via des ateliers', 'Pour les aidants des familles ou les parents solos (à intégrer dans un projet parentalité)', 5, (SELECT id FROM public.program_items WHERE title = 'SOCIAL (CCAS)')),
('Lancement d''un "café solidaire ou ciné débat"', '', 6, (SELECT id FROM public.program_items WHERE title = 'SOCIAL (CCAS)')),
('Soutien financier et logistique de la commune', 'Pour les initiatives citoyennes d''entraide « Communo à développer »', 7, (SELECT id FROM public.program_items WHERE title = 'SOCIAL (CCAS)')),
('Budget participatif au sein de la commune', '?', 8, (SELECT id FROM public.program_items WHERE title = 'SOCIAL (CCAS)'));

-- PETITE ENFANCE
INSERT INTO public.program_points (title, content, position, program_item_id) VALUES
('Création d''une permanence du LAEP sur Gétigné', '', 1, (SELECT id FROM public.program_items WHERE title = 'PETITE ENFANCE')),
('Développer l''offre de garde d''enfants', 'En créant une crèche en plein air', 2, (SELECT id FROM public.program_items WHERE title = 'PETITE ENFANCE')),
('Diagnostic territorial existant', '?', 3, (SELECT id FROM public.program_items WHERE title = 'PETITE ENFANCE'));

-- ALIMENTATION
INSERT INTO public.program_points (title, content, position, program_item_id) VALUES
('Organiser un marché bio et local hebdomadaire', 'Mettre en place un marché bio hebdomadaire pour permettre aux producteur-rice-s locaux de vendre leurs produits sains et équitables. Faire évoluer le marché existant', 1, (SELECT id FROM public.program_items WHERE title = 'ALIMENTATION')),
('Développer des jardins partagés', 'Créer des jardins partagés permettant à chacun.e de cultiver des légumes bio et de renouer avec la nature', 2, (SELECT id FROM public.program_items WHERE title = 'ALIMENTATION')),
('Instaurer une ferme en régie municipale', 'Créer une ferme municipale produisant des fruits, légumes et autres denrées alimentaires, entièrement gérée par la commune pour garantir une alimentation locale, biologique et accessible. Suite Biocat ? Vérifier propriété terrains Biocat', 3, (SELECT id FROM public.program_items WHERE title = 'ALIMENTATION')),
('Revoir la tarification pour les familles', 'Mettre en place une tarification progressive permettant aux familles les plus modestes de bénéficier d''un coût réduit pour les repas scolaires, tout en générant des ressources pour améliorer la qualité des repas', 4, (SELECT id FROM public.program_items WHERE title = 'ALIMENTATION')),
('Améliorer l''offre de restauration scolaire', 'Passer à une alimentation 100 % bio et si possible 100 % locale, sans surcoût pour les familles, grâce à une meilleure gestion des coûts et des ressources locales', 5, (SELECT id FROM public.program_items WHERE title = 'ALIMENTATION')),
('S''engager dans une démarche de labellisation', 'Obtenir le label "Territoire Bio Engagé", garantissant un engagement fort de la commune en faveur de l''agriculture biologique et de l''approvisionnement bio en restauration collective', 6, (SELECT id FROM public.program_items WHERE title = 'ALIMENTATION')),
('Programme d''éducation alimentaire', 'Instaurer un programme éducatif sur la nutrition, la biodiversité alimentaire et les circuits courts dans les établissements scolaires et pour les familles', 7, (SELECT id FROM public.program_items WHERE title = 'ALIMENTATION'));

-- ÉCONOMIE LOCALE
INSERT INTO public.program_points (title, content, position, program_item_id) VALUES
('Création d''un engagement "Commerce Durable"', 'Attention au mot label, parler d''engagement des entreprises de la commune pour encourager des pratiques plus durables', 1, (SELECT id FROM public.program_items WHERE title = 'ÉCONOMIE LOCALE')),
('Faciliter la mobilité douce vers les zones commerciales', 'En lien avec la thématique « aménagement »', 2, (SELECT id FROM public.program_items WHERE title = 'ÉCONOMIE LOCALE')),
('Pour les 3 ZAC de Gétigné : Création d''une plateforme collaborative inter-entreprises', '', 3, (SELECT id FROM public.program_items WHERE title = 'ÉCONOMIE LOCALE')),
('Pour aller plus loin : mise en place d''un pôle d''économie circulaire', '', 4, (SELECT id FROM public.program_items WHERE title = 'ÉCONOMIE LOCALE')),
('Mutualisation des flux logistiques et transports', '', 5, (SELECT id FROM public.program_items WHERE title = 'ÉCONOMIE LOCALE')),
('Développement de l''énergie locale et partagée', '', 6, (SELECT id FROM public.program_items WHERE title = 'ÉCONOMIE LOCALE')),
('Structurer la coopération', '', 7, (SELECT id FROM public.program_items WHERE title = 'ÉCONOMIE LOCALE')),
('Question des déchets', '', 8, (SELECT id FROM public.program_items WHERE title = 'ÉCONOMIE LOCALE'));

-- AGRICULTURE
INSERT INTO public.program_points (title, content, position, program_item_id) VALUES
('Instaurer une ferme en régie municipale', 'Cf thématique alimentation', 1, (SELECT id FROM public.program_items WHERE title = 'AGRICULTURE')),
('Organiser un marché bio et local hebdomadaire', 'Cf thématique alimentation', 2, (SELECT id FROM public.program_items WHERE title = 'AGRICULTURE')),
('Soutien à l''installation de jeunes agriculteurs en bio', '', 3, (SELECT id FROM public.program_items WHERE title = 'AGRICULTURE')),
('Faciliter la création d''une coopérative agricole locale', '', 4, (SELECT id FROM public.program_items WHERE title = 'AGRICULTURE'));

-- ALIMENTATION / SANTÉ
INSERT INTO public.program_points (title, content, position, program_item_id) VALUES
('Programmes d''éducation alimentaire', 'Ce que la commune peut mettre en place, soutenir elle-même', 1, (SELECT id FROM public.program_items WHERE title = 'ALIMENTATION / SANTÉ'));

-- Mise à jour des timestamps
UPDATE public.program_general SET updated_at = NOW();
UPDATE public.program_items SET updated_at = NOW();
UPDATE public.program_points SET updated_at = NOW();

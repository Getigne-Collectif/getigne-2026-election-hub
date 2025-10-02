-- Exemples d'événements de voisinage (cafés de quartier) pour Gétigné
-- À exécuter dans l'interface Supabase SQL Editor après avoir appliqué la migration

-- Café de quartier 1: Centre-ville
INSERT INTO public.events (
  title,
  description,
  content,
  date,
  location,
  image,
  event_type,
  latitude,
  longitude,
  organizer_name,
  organizer_contact,
  kit_provided,
  member_present,
  allow_registration,
  is_members_only,
  status,
  slug
) VALUES (
  'Café de quartier - Centre-ville',
  'Venez échanger autour d''un café dans une ambiance conviviale ! Parlons de nos projets pour améliorer la vie de quartier.',
  '## Bienvenue au Café de quartier du centre-ville !

Rejoignez-nous pour un moment d''échange convivial autour des enjeux de notre quartier. Cette rencontre est l''occasion de :

- **Faire connaissance** avec vos voisins
- **Partager vos idées** pour améliorer le quotidien
- **Découvrir les projets** du collectif citoyen
- **Proposer des initiatives** locales

### Déroulement de la soirée
- 19h00 : Accueil et présentation
- 19h15 : Tour de table des participants
- 19h30 : Discussion libre sur les préoccupations du quartier
- 20h30 : Présentation des actions possibles
- 21h00 : Verre de l''amitié

### Ce qui vous attend
Un kit complet sera fourni avec des supports de discussion, des rafraîchissements et tout le nécessaire pour passer un bon moment ensemble. Un membre du collectif sera présent pour animer et répondre à vos questions.

Venez comme vous êtes, l''important c''est de participer !',
  '2025-02-15 19:00:00',
  '12 Place de la Mairie, Gétigné',
  'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&h=600&fit=crop',
  'neighborhood',
  47.0847,
  -1.2614,
  'Marie Durand',
  'marie.durand@email.com',
  true,
  true,
  true,
  false,
  'published',
  'cafe-de-quartier-centre-ville-fevrier-2025'
);

-- Café de quartier 2: Quartier des Jardins
INSERT INTO public.events (
  title,
  description,
  content,
  date,
  location,
  image,
  event_type,
  latitude,
  longitude,
  organizer_name,
  organizer_contact,
  kit_provided,
  member_present,
  allow_registration,
  is_members_only,
  status,
  slug
) VALUES (
  'Café de quartier - Quartier des Jardins',
  'Rencontre de voisinage dans le quartier des Jardins. Échangeons sur l''aménagement des espaces verts et la mobilité douce.',
  '## Café de quartier - Quartier des Jardins

Une rencontre spécialement dédiée aux habitants du quartier des Jardins pour parler de nos priorités communes.

### Thèmes de discussion
- Aménagement des espaces verts
- Pistes cyclables et mobilité douce  
- Sécurité et éclairage public
- Animations de quartier

### Informations pratiques
Rendez-vous chez Paul et Sylvie Martin dans leur jardin (si beau temps) ou en intérieur selon la météo. 

Un membre du collectif sera présent pour prendre note de vos suggestions et vous expliquer comment les porter au niveau municipal.',
  '2025-02-22 14:30:00',
  '15 Rue des Tilleuls, Gétigné',
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=600&fit=crop',
  'neighborhood',
  47.0892,
  -1.2573,
  'Paul Martin',
  '06 12 34 56 78',
  true,
  true,
  true,
  false,
  'published',
  'cafe-de-quartier-jardins-fevrier-2025'
);

-- Café de quartier 3: Près de l'école
INSERT INTO public.events (
  title,
  description,
  content,
  date,
  location,
  image,
  event_type,
  latitude,
  longitude,
  organizer_name,
  organizer_contact,
  kit_provided,
  member_present,
  allow_registration,
  is_members_only,
  status,
  slug
) VALUES (
  'Café des parents - Secteur école',
  'Café de quartier spécial parents d''élèves. Parlons éducation, transport scolaire et sécurité aux abords de l''école.',
  '## Café des parents - Secteur école

Un Café de quartier pensé pour les parents d''élèves et les familles du secteur de l''école primaire.

### Au programme
- **Sécurité** aux abords de l''école
- **Transport scolaire** et covoiturage  
- **Activités périscolaires** 
- **Environnement éducatif**

### Accueil spécial familles
Les enfants sont les bienvenus ! Un espace leur sera dédié avec des jeux et livres.

### Organisé par
Cette rencontre est organisée par Sophie, parent d''élève et membre du conseil d''école, en partenariat avec le collectif citoyen.',
  '2025-03-01 10:00:00',
  '8 Rue de l''École, Gétigné',
  'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&h=600&fit=crop',
  'neighborhood',
  47.0823,
  -1.2649,
  'Sophie Lefevre',
  'sophie.lefevre@email.com',
  true,
  true,
  true,
  false,
  'published',
  'cafe-des-parents-ecole-mars-2025'
);









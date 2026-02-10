insert into public.app_settings (key, value, description)
values
  (
    'branding',
    jsonb_build_object(
      'name', 'Gétigné Collectif',
      'slogan', 'Élections municipales 2026',
      'logoUrl', '/images/getigne-collectif-logo.png',
      'city', 'Gétigné',
      'colors', jsonb_build_object(
        'green', '#34b190',
        'yellow', '#fbbf24',
        'orange', '#f97316',
        'blue', '#2563eb',
        'red', '#dc2626'
      ),
      'images', jsonb_build_object(
        'hero', 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=2940&q=80',
        'campaign', '/images/GC-group1.jpg',
        'neighborhood', '/images/getigne-places.png'
      )
    ),
    'Configuration branding'
  ),
  (
    'content',
    jsonb_build_object(
      'heroTitle', 'Vivre dans une commune',
      'heroTitleEmphasis', 'dynamique, engagée et démocratique',
      'heroTitleSuffix', 'ça vous tente ?',
      'heroSubtitle', 'Déployons la force du collectif pour faire de Gétigné une commune plus engagée, au service de toutes et tous.',
      'footerAbout', E'Collectif citoyen engagé pour les élections municipales depuis 2020 à Gétigné.\nEnsemble, construisons une commune plus dynamique, engagée et démocratique.',
      'contactEmail', 'contact@getigne-collectif.fr',
      'contactPhone', '06 66 77 75 20',
      'contactAddress', E'19 le bois de la roche\n44190 Gétigné',
      'siteDescription', 'Collectif citoyen engagé pour les élections municipales depuis 2020 à Gétigné.'
    ),
    'Configuration contenu'
  ),
  (
    'map',
    jsonb_build_object(
      'center', jsonb_build_object('lat', 47.0847, 'lng', -1.2614),
      'zoom', 13
    ),
    'Configuration carte'
  ),
  (
    'modules',
    jsonb_build_object(
      'program', true,
      'supportCommittee', true,
      'membershipForm', true,
      'agenda', true,
      'blog', true,
      'proxy', true,
      'committees', true,
      'projects', true,
      'committeeWorksPublic', true
    ),
    'Configuration modules'
  )
on conflict (key)
do update set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();

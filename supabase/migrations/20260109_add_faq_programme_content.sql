-- Migration: Ajout du contenu complet de la FAQ Programme
-- Catégories: Démocratie locale & gouvernance, Finances communales, Enfance/jeunesse, Projets structurants, Énergie, Agriculture, L'équipe

-- 1. Catégorie "🗳️ Démocratie locale & gouvernance"
INSERT INTO public.faq_categories (faq_id, name, icon, position)
SELECT id, '🗳️ Démocratie locale & gouvernance', 'Users', 0
FROM public.faqs
WHERE slug = 'faq-programme'
ON CONFLICT DO NOTHING;

-- Questions pour "Démocratie locale & gouvernance"
INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Votre projet de participation citoyenne, est-ce que ce n''est pas du "blabla" de plus ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"Non. La participation est structurée, cadrée et reliée à la décision politique.","textAlign":"left","textSize":"normal"}},{"id":"2","type":"paragraph","data":{"text":"Nous mettrons en place des groupes de travail ouverts aux citoyen·ne·s, rattachés aux commissions municipales, fonctionnant sur la base du volontariat et, lorsque c''est pertinent, du tirage au sort.","textAlign":"left","textSize":"normal"}},{"id":"3","type":"paragraph","data":{"text":"Ces groupes travailleront sur des sujets précis, à des moments identifiés, avec un retour systématique sur ce qui a été retenu ou non.","textAlign":"left","textSize":"normal"}},{"id":"4","type":"paragraph","data":{"text":"👉 Les élu·e·s gardent la responsabilité finale des décisions, mais les choix seront éclairés par le terrain.","textAlign":"left","textSize":"normal"}}],"version":"2.24.3"}'::jsonb,
    'validated',
    0
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = '🗳️ Démocratie locale & gouvernance'
ON CONFLICT DO NOTHING;

INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Qui décide à la fin ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"Les élu·e·s, comme le prévoit la loi.","textAlign":"left","textSize":"normal"}},{"id":"2","type":"paragraph","data":{"text":"La participation n''est ni un gadget ni une délégation totale, c''est un outil pour mieux décider, en s''appuyant sur l''expertise d''usage des habitant·e·s.","textAlign":"left","textSize":"normal"}}],"version":"2.24.3"}'::jsonb,
    'validated',
    1
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = '🗳️ Démocratie locale & gouvernance'
ON CONFLICT DO NOTHING;

INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Tout le monde aura-t-il vraiment accès à l''information ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"Oui. La transparence est un engagement central :","textAlign":"left","textSize":"normal"}},{"id":"2","type":"list","data":{"style":"unordered","items":["information claire et compréhensible,","comptes-rendus réguliers,","bulletins municipaux dédiés,","plateforme numérique citoyenne pour suivre les projets et contribuer entre deux réunions."]}}],"version":"2.24.3"}'::jsonb,
    'validated',
    2
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = '🗳️ Démocratie locale & gouvernance'
ON CONFLICT DO NOTHING;

-- 2. Mettre à jour la catégorie "Finances" en "💰 Finances communales"
UPDATE public.faq_categories
SET name = '💰 Finances communales', position = 2
WHERE faq_id = (SELECT id FROM public.faqs WHERE slug = 'faq-programme')
  AND name = 'Finances';

-- Questions pour "Finances communales" (ajout après les existantes)
INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Votre programme est-il financièrement réaliste ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"Oui. Le programme repose sur trois principes clairs :","textAlign":"left","textSize":"normal"}},{"id":"2","type":"list","data":{"style":"unordered","items":["Utiliser l''existant avant de construire du neuf","Prioriser les investissements utiles et finançables","Mobiliser les cofinancements disponibles (CAF, partenaires publics, appels à projets)"]}},{"id":"3","type":"paragraph","data":{"text":"Exemple concret : le centre socio-culturel s''appuie sur un bâtiment existant et bénéficie d''un cofinancement CAF de plus de 100 000 € par an, limitant fortement l''impact sur le budget communal.","textAlign":"left","textSize":"normal"}}],"version":"2.24.3"}'::jsonb,
    'validated',
    5
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = '💰 Finances communales'
ON CONFLICT DO NOTHING;

INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Allez-vous augmenter les impôts ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"Ce n''est ni un objectif ni un préalable de notre programme.","textAlign":"left","textSize":"normal"}},{"id":"2","type":"paragraph","data":{"text":"Notre priorité est une gestion rigoureuse, avec :","textAlign":"left","textSize":"normal"}},{"id":"3","type":"list","data":{"style":"unordered","items":["un plan pluriannuel d''investissement hiérarchisé,","des dépenses évaluées en amont,","des arbitrages transparents."]}},{"id":"4","type":"paragraph","data":{"text":"Chaque euro dépensé devra répondre à un besoin réel et mesurable pour la population.","textAlign":"left","textSize":"normal"}}],"version":"2.24.3"}'::jsonb,
    'validated',
    6
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = '💰 Finances communales'
ON CONFLICT DO NOTHING;

INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Les aides (culture, sport, associations) ne vont-elles pas exploser le budget ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"Non, car elles sont ciblées et conditionnées.","textAlign":"left","textSize":"normal"}},{"id":"2","type":"paragraph","data":{"text":"Les subventions seront maintenues, mais bonifiées uniquement lorsque les associations s''engagent :","textAlign":"left","textSize":"normal"}},{"id":"3","type":"list","data":{"style":"unordered","items":["sur l''accessibilité financière,","l''inclusion,","la transition écologique."]}},{"id":"4","type":"paragraph","data":{"text":"Le dispositif GETPACK est un bon exemple : aide directe aux habitants, versement maîtrisé, et soutien indirect mais efficace aux associations.","textAlign":"left","textSize":"normal"}}],"version":"2.24.3"}'::jsonb,
    'validated',
    7
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = '💰 Finances communales'
ON CONFLICT DO NOTHING;

-- 3. Catégorie "🏫 Enfance, jeunesse & éducation"
INSERT INTO public.faq_categories (faq_id, name, icon, position)
SELECT id, '🏫 Enfance, jeunesse & éducation', 'BookOpen', 3
FROM public.faqs
WHERE slug = 'faq-programme'
ON CONFLICT DO NOTHING;

INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Allez-vous bouleverser le fonctionnement des écoles ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"Non. Il s''agit d''améliorer, pas de désorganiser.","textAlign":"left","textSize":"normal"}},{"id":"2","type":"paragraph","data":{"text":"La création du Conseil du pôle enfance vise à mieux coordonner ce qui existe déjà (écoles, périscolaire, restauration, bibliothèque), en associant les équipes éducatives et les familles.","textAlign":"left","textSize":"normal"}}],"version":"2.24.3"}'::jsonb,
    'validated',
    0
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = '🏫 Enfance, jeunesse & éducation'
ON CONFLICT DO NOTHING;

INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'La végétalisation des cours, est-ce une priorité ou un luxe ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"C''est une mesure de santé, de bien-être et d''adaptation climatique.","textAlign":"left","textSize":"normal"}},{"id":"2","type":"paragraph","data":{"text":"Elle sera menée progressivement, en concertation, et pensée de manière globale : ombrage, sols, usages, inclusion, jeux libres.","textAlign":"left","textSize":"normal"}}],"version":"2.24.3"}'::jsonb,
    'validated',
    1
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = '🏫 Enfance, jeunesse & éducation'
ON CONFLICT DO NOTHING;

-- 4. Catégorie "🏗️ Projets structurants"
INSERT INTO public.faq_categories (faq_id, name, icon, position)
SELECT id, '🏗️ Projets structurants', 'Building', 4
FROM public.faqs
WHERE slug = 'faq-programme'
ON CONFLICT DO NOTHING;

INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Pourquoi un centre socio-culturel ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"Parce qu''il manque aujourd''hui un lieu central, ouvert et transversal, capable de :","textAlign":"left","textSize":"normal"}},{"id":"2","type":"list","data":{"style":"unordered","items":["soutenir les familles,","renforcer la vie associative,","accueillir des initiatives citoyennes,","créer du lien intergénérationnel."]}},{"id":"3","type":"paragraph","data":{"text":"Ce n''est pas \"un équipement de plus\", c''est un outil pour faire vivre la commune autrement.","textAlign":"left","textSize":"normal"}}],"version":"2.24.3"}'::jsonb,
    'validated',
    0
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = '🏗️ Projets structurants'
ON CONFLICT DO NOTHING;

INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Et si ça ne marche pas ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"Le projet est progressif et évalué :","textAlign":"left","textSize":"normal"}},{"id":"2","type":"list","data":{"style":"unordered","items":["concertation dès le début,","ouverture avec une programmation co-construite,","bilan participatif après un an,","ajustements si nécessaire."]}}],"version":"2.24.3"}'::jsonb,
    'validated',
    1
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = '🏗️ Projets structurants'
ON CONFLICT DO NOTHING;

-- 5. Catégorie "⚡ Énergie & transition"
INSERT INTO public.faq_categories (faq_id, name, icon, position)
SELECT id, '⚡ Énergie & transition', 'Zap', 5
FROM public.faqs
WHERE slug = 'faq-programme'
ON CONFLICT DO NOTHING;

INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Votre plan énergie, ce n''est pas trop ambitieux pour une commune ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"Il est ambitieux, mais étalé dans le temps et structuré.","textAlign":"left","textSize":"normal"}},{"id":"2","type":"paragraph","data":{"text":"Diagnostic, priorisation, actions rapides, puis rénovations lourdes : chaque étape est planifiée.","textAlign":"left","textSize":"normal"}},{"id":"3","type":"paragraph","data":{"text":"Objectif clair : réduire les dépenses énergétiques, améliorer le patrimoine communal et renforcer l''autonomie à long terme.","textAlign":"left","textSize":"normal"}}],"version":"2.24.3"}'::jsonb,
    'validated',
    0
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = '⚡ Énergie & transition'
ON CONFLICT DO NOTHING;

INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Est-ce que cela va coûter cher aux habitants ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"Non. Le plan vise d''abord le patrimoine communal.","textAlign":"left","textSize":"normal"}},{"id":"2","type":"paragraph","data":{"text":"À terme, il peut même générer des économies de fonctionnement et ouvrir la voie à des projets collectifs (boucles locales d''énergie).","textAlign":"left","textSize":"normal"}}],"version":"2.24.3"}'::jsonb,
    'validated',
    1
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = '⚡ Énergie & transition'
ON CONFLICT DO NOTHING;

-- 6. Catégorie "🌱 Agriculture & alimentation"
INSERT INTO public.faq_categories (faq_id, name, icon, position)
SELECT id, '🌱 Agriculture & alimentation', 'Sprout', 6
FROM public.faqs
WHERE slug = 'faq-programme'
ON CONFLICT DO NOTHING;

INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'La commune a-t-elle vraiment un rôle à jouer en agriculture ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"Oui, à son échelle.","textAlign":"left","textSize":"normal"}},{"id":"2","type":"paragraph","data":{"text":"Nous agirons sur ce qui est à notre portée :","textAlign":"left","textSize":"normal"}},{"id":"3","type":"list","data":{"style":"unordered","items":["accompagnement à l''installation et à la transmission,","débouchés locaux (restauration scolaire),","soutien aux transitions volontaires,","accès à une alimentation de qualité pour toutes et tous."]}}],"version":"2.24.3"}'::jsonb,
    'validated',
    0
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = '🌱 Agriculture & alimentation'
ON CONFLICT DO NOTHING;

INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Le bio pour tous, ce n''est pas irréaliste ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"Non, si on s''y prend intelligemment.","textAlign":"left","textSize":"normal"}},{"id":"2","type":"paragraph","data":{"text":"Des programmes existants montrent qu''il est possible de manger mieux sans dépenser plus, en changeant les pratiques, pas en culpabilisant.","textAlign":"left","textSize":"normal"}}],"version":"2.24.3"}'::jsonb,
    'validated',
    1
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = '🌱 Agriculture & alimentation'
ON CONFLICT DO NOTHING;

-- 7. Catégorie "L'équipe"
INSERT INTO public.faq_categories (faq_id, name, icon, position)
SELECT id, 'L''équipe', 'Users', 7
FROM public.faqs
WHERE slug = 'faq-programme'
ON CONFLICT DO NOTHING;

INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Êtes-vous une équipe expérimentée ou juste pleine de bonnes idées ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"Nous sommes une équipe collective, compétente et consciente des contraintes.","textAlign":"left","textSize":"normal"}},{"id":"2","type":"paragraph","data":{"text":"Ce programme n''est pas une liste de promesses : c''est un cap, une méthode et des priorités assumées.","textAlign":"left","textSize":"normal"}},{"id":"3","type":"paragraph","data":{"text":"Et surtout, nous faisons le pari de l''intelligence collective sans jamais fuir nos responsabilités.","textAlign":"left","textSize":"normal"}}],"version":"2.24.3"}'::jsonb,
    'validated',
    0
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = 'L''équipe'
ON CONFLICT DO NOTHING;


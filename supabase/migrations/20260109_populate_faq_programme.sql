-- Migration: Insertion de la FAQ Programme avec la catégorie Finances et les questions/réponses existantes

-- Insérer la FAQ "FAQ Programme"
INSERT INTO public.faqs (name, slug) VALUES
('FAQ Programme', 'faq-programme')
ON CONFLICT (slug) DO NOTHING;

-- Insérer la catégorie "Finances" pour la FAQ Programme
INSERT INTO public.faq_categories (faq_id, name, icon, position)
SELECT id, 'Finances', 'Wallet', 1
FROM public.faqs
WHERE slug = 'faq-programme'
ON CONFLICT DO NOTHING;

-- Insérer les questions/réponses avec status = 'validated' (car elles sont déjà publiées)
-- Question 1: Comment allez-vous gérer les finances de la commune ?
INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Comment allez-vous gérer les finances de la commune ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"La gestion financière d''une commune n''est pas une fin en soi, mais un outil au service de notre projet politique. Chaque dépense, chaque investissement, chaque économie traduit des choix assumés pour l''avenir de Gétigné. Nous entendons faire de ces choix des décisions collectives, transparentes et ancrées dans la réalité des ressources disponibles.","textAlign":"left","textSize":"normal"}},{"id":"2","type":"paragraph","data":{"text":"Notre approche s''articule autour de la sobriété budgétaire et de l''optimisation des dépenses existantes. Avant d''envisager de nouvelles charges, nous nous concentrerons sur l''amélioration de l''efficacité de l''action publique. Il s''agit de mieux utiliser chaque euro, de réduire les gaspillages et de privilégier les investissements qui génèrent des économies à moyen terme, notamment en matière énergétique et de maintenance.","textAlign":"left","textSize":"normal"}}],"version":"2.24.3"}'::jsonb,
    'validated',
    1
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = 'Finances'
ON CONFLICT DO NOTHING;

-- Question 2: Quelle est votre position sur l'endettement communal ?
INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Quelle est votre position sur l''endettement communal ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"L''endettement communal fait l''objet d''une vigilance particulière. Ni dogmatiques ni laxistes, nous évaluerons chaque projet d''emprunt à l''aune de son utilité pour les habitant·e·s, de son impact environnemental et de sa soutenabilité financière.","textAlign":"left","textSize":"normal"}},{"id":"2","type":"paragraph","data":{"text":"Nous refuserons catégoriquement tout projet démesuré ou incompatible avec les capacités réelles de la commune, qu''il s''agisse d''équipements surdimensionnés ou d''opérations d''urbanisme inadaptées. Nous garderons une capacité d''investissement pour les projets prioritaires qui servent réellement l''intérêt communal.","textAlign":"left","textSize":"normal"}}],"version":"2.24.3"}'::jsonb,
    'validated',
    2
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = 'Finances'
ON CONFLICT DO NOTHING;

-- Question 3: Allez-vous rechercher des financements externes ?
INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Allez-vous rechercher des financements externes ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"Oui, nous mènerons une recherche active de financements externes lorsque ceux-ci sont cohérents avec nos objectifs et l''intérêt communal. Subventions européennes, régionales ou départementales, partenariats avec d''autres collectivités, contrats de mutualisation : autant de leviers que nous mobiliserons avec discernement.","textAlign":"left","textSize":"normal"}},{"id":"2","type":"paragraph","data":{"text":"Nous éviterons toute dépendance excessive ou tout projet dicté uniquement par la disponibilité de fonds. Chaque financement externe sera évalué à l''aune de sa cohérence avec nos valeurs écologiques et sociales, et de son utilité réelle pour les habitant·e·s.","textAlign":"left","textSize":"normal"}}],"version":"2.24.3"}'::jsonb,
    'validated',
    3
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = 'Finances'
ON CONFLICT DO NOTHING;

-- Question 4: Comment garantissez-vous la transparence budgétaire ?
INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Comment garantissez-vous la transparence budgétaire ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"paragraph","data":{"text":"La transparence budgétaire et l''information des habitant·e·s constituent un engagement fort de notre mandat. Les documents budgétaires seront rendus accessibles, expliqués régulièrement lors de réunions publiques et de séances du conseil municipal.","textAlign":"left","textSize":"normal"}},{"id":"2","type":"paragraph","data":{"text":"Nous mettrons en place des outils de suivi permettant à chaque citoyen·ne de comprendre l''évolution des finances communales et l''impact concret des décisions prises. Chaque choix budgétaire sera expliqué et justifié, avec une attention particulière à rendre ces informations compréhensibles par toutes et tous.","textAlign":"left","textSize":"normal"}}],"version":"2.24.3"}'::jsonb,
    'validated',
    4
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = 'Finances'
ON CONFLICT DO NOTHING;

-- Question 5: Quels sont vos principes de décision financière ?
INSERT INTO public.faq_items (faq_category_id, question, answer, status, position)
SELECT 
    fc.id,
    'Quels sont vos principes de décision financière ?',
    '{"time":1736457600000,"blocks":[{"id":"1","type":"list","data":{"style":"unordered","items":["Évaluer chaque dépense à l''aune de son utilité pour les habitant·e·s et de sa cohérence avec nos valeurs écologiques et sociales.","Privilégier la sobriété et l''optimisation avant toute création de nouvelles charges.","Assurer une vigilance constante sur l''endettement, en gardant une capacité d''investissement pour les projets prioritaires.","Rechercher activement des financements externes cohérents avec nos objectifs politiques.","Garantir une transparence totale sur les choix budgétaires et leur impact concret."]}}],"version":"2.24.3"}'::jsonb,
    'validated',
    5
FROM public.faq_categories fc
INNER JOIN public.faqs f ON fc.faq_id = f.id
WHERE f.slug = 'faq-programme' AND fc.name = 'Finances'
ON CONFLICT DO NOTHING;


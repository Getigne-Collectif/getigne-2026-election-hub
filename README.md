# Bienvenue

## Infos du projet

**URL**: https://getigne-collectif.fr

## Installation

```bash
yarn install
```

## Démarrage

```bash
yarn dev
```

## Déploiement

Just push and deploy to Vercel

## Supabase

Le projet utilise Supabase pour plusieurs choses :

- l'authentification
- les données liées à notre collectif, notamment :
  - l'association / collectif
  - le programme
  - les commissions
  - l'agenda (événements) et inscriptions
  - le blog (actualités) et commentaires
  - ...
- fonctions (webhooks et API) pour :
  - synchroniser les calendriers
  - générer les flux RSS
  - notifications Discord
  - formulaire de contact
  - invitation d'utilisateur

### Fonctionnement

Pour déployer les fonctions, suivez la documentation [Supabase](https://supabase.com/docs/guides/functions) puis, une fois la fonction créé dans le répertoire `supabase/functions`, déployez-la comme ceci :

```
SUPABASE_ACCESS_TOKEN=<access-token> supabase functions deploy <nom-de-la-fonction> --project-ref <project-id>
```
> - `jqpivqdwblrccjzicnxn` est le project-id de notre projet
> - les access token peuvent être générés dans [Accounts > Access Tokens](https://supabase.com/dashboard/account/tokens)

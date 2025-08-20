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

## Variables d'environnement

### Frontend (Vite)

À définir dans un fichier `.env.local` (non commité) à la racine :

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PUBLIC_URL=https://getigne-collectif.fr
VITE_DISCORD_INVITE_URL=
VITE_HELLOASSO_JOIN_URL=
```

- `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont requis pour le client.
- Les autres sont optionnels mais pratiques pour éviter d'avoir des URLs codées en dur.

### Supabase Edge Functions (secrets)

Ces variables doivent être définies comme secrets du projet Supabase (ne pas les stocker côté client) :

```
SUPABASE_URL="https://<ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
PUBLIC_URL="https://getigne-collectif.fr"
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
DISCORD_BOT_TOKEN="<bot-token>"
DISCORD_GUILD_ID="<guild-id>"
CONTACT_EMAIL="contact@getigne-collectif.fr"
WEBSITE_URL="https://getigne-collectif.fr"
```

Commande type pour les secrets :

```
supabase secrets set \
  SUPABASE_URL="https://<ref>.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
  PUBLIC_URL="https://getigne-collectif.fr" \
  DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." \
  DISCORD_BOT_TOKEN="<bot-token>" \
  DISCORD_GUILD_ID="<guild-id>" \
  CONTACT_EMAIL="contact@getigne-collectif.fr" \
  WEBSITE_URL="https://getigne-collectif.fr"
```

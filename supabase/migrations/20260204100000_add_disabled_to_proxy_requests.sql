-- Ajout du champ disabled pour exclure un mandant/mandataire du matching
-- (ex. désinscription, erreur, doublon). Si la personne est dans un binôme,
-- l'admin doit d'abord casser le binôme ou la désactivation le fait automatiquement.
ALTER TABLE public.proxy_requests
  ADD COLUMN IF NOT EXISTS disabled BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_proxy_requests_disabled ON public.proxy_requests(disabled)
  WHERE disabled = false;

COMMENT ON COLUMN public.proxy_requests.disabled IS 'Si true, la personne est exclue des listes de matching (désactivée par l''admin).';

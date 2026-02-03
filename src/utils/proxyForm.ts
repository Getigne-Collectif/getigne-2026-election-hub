import { z } from 'zod';

const votingBureauSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]).optional().nullable();

export const proxyFormSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  nationalElectorNumber: z
    .string()
    .min(1, 'Le numéro national d\'électeur/électrice est requis')
    .regex(/^[0-9]{1,15}$/, 'Le NNE doit contenir uniquement des chiffres (sans espace)'),
  phone: z
    .string()
    .min(1, 'Le numéro de téléphone est requis')
    .regex(/^[0-9\s+.()-]{8,20}$/, 'Numéro de téléphone invalide'),
  email: z.string().min(1, 'L\'email est requis').email('Email invalide'),
  votingBureau: votingBureauSchema,
  supportCommitteeConsent: z.boolean(),
  newsletterConsent: z.boolean(),
});

export type ProxyFormValues = z.infer<typeof proxyFormSchema>;

export const proxyFormDefaultValues: ProxyFormValues = {
  firstName: '',
  lastName: '',
  nationalElectorNumber: '',
  phone: '',
  email: '',
  votingBureau: null,
  supportCommitteeConsent: true,
  newsletterConsent: true,
};

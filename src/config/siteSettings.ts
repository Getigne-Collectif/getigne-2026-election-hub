import * as z from 'zod';

export enum SiteSettingsSection {
  Branding = 'branding',
  Content = 'content',
  Map = 'map',
  Modules = 'modules',
}

export enum ModuleKey {
  Program = 'program',
  SupportCommittee = 'supportCommittee',
  MembershipForm = 'membershipForm',
  Agenda = 'agenda',
  Blog = 'blog',
  Proxy = 'proxy',
  Committees = 'committees',
  Projects = 'projects',
  CommitteeWorksPublic = 'committeeWorksPublic',
}

export enum BrandColorKey {
  Green = 'green',
  Yellow = 'yellow',
  Orange = 'orange',
  Blue = 'blue',
  Red = 'red',
}

export type BrandColors = {
  green: string;
  yellow: string;
  orange: string;
  blue: string;
  red: string;
};

export type BrandingSettings = {
  name: string;
  slogan: string;
  logoUrl: string;
  city: string;
  colors: BrandColors;
  images: {
    hero: string;
    campaign: string;
    neighborhood: string;
  };
};

export type ContentSettings = {
  heroTitle: string;
  heroTitleEmphasis: string;
  heroTitleSuffix: string;
  heroSubtitle: string;
  footerAbout: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  siteDescription: string;
};

export type MapSettings = {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
};

export type ModuleSettings = {
  program: boolean;
  supportCommittee: boolean;
  membershipForm: boolean;
  agenda: boolean;
  blog: boolean;
  proxy: boolean;
  committees: boolean;
  projects: boolean;
  committeeWorksPublic: boolean;
};

export type SiteSettings = {
  branding: BrandingSettings;
  content: ContentSettings;
  map: MapSettings;
  modules: ModuleSettings;
};

export type SiteSettingsByKey = {
  [SiteSettingsSection.Branding]: BrandingSettings;
  [SiteSettingsSection.Content]: ContentSettings;
  [SiteSettingsSection.Map]: MapSettings;
  [SiteSettingsSection.Modules]: ModuleSettings;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  branding: {
    name: 'Gétigné Collectif',
    slogan: 'Élections municipales 2026',
    logoUrl: '/images/getigne-collectif-logo.png',
    city: 'Gétigné',
    colors: {
      green: '#34b190',
      yellow: '#fbbf24',
      orange: '#f97316',
      blue: '#2563eb',
      red: '#dc2626',
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=2940&q=80',
      campaign: '/images/GC-group1.jpg',
      neighborhood: '/images/getigne-places.png',
    },
  },
  content: {
    heroTitle: 'Vivre dans une commune',
    heroTitleEmphasis: 'dynamique, engagée et démocratique',
    heroTitleSuffix: 'ça vous tente ?',
    heroSubtitle:
      "Déployons la force du collectif pour faire de Gétigné une commune plus engagée, au service de toutes et tous.",
    footerAbout:
      'Collectif citoyen engagé pour les élections municipales depuis 2020 à Gétigné.\nEnsemble, construisons une commune plus dynamique, engagée et démocratique.',
    contactEmail: 'contact@getigne-collectif.fr',
    contactPhone: '06 66 77 75 20',
    contactAddress: '19 le bois de la roche\n44190 Gétigné',
    siteDescription:
      'Collectif citoyen engagé pour les élections municipales depuis 2020 à Gétigné.',
  },
  map: {
    center: { lat: 47.0847, lng: -1.2614 },
    zoom: 13,
  },
  modules: {
    program: true,
    supportCommittee: true,
    membershipForm: true,
    agenda: true,
    blog: true,
    proxy: true,
    committees: true,
    projects: true,
    committeeWorksPublic: true,
  },
};

const colorSchema = z.string().min(1);

const brandingSchema = z.object({
  name: z.string().min(1),
  slogan: z.string().min(1),
  logoUrl: z.string().min(1),
  city: z.string().min(1),
  colors: z.object({
    green: colorSchema,
    yellow: colorSchema,
    orange: colorSchema,
    blue: colorSchema,
    red: colorSchema,
  }),
  images: z.object({
    hero: z.string().min(1),
    campaign: z.string().min(1),
    neighborhood: z.string().min(1),
  }),
});

const contentSchema = z.object({
  heroTitle: z.string().min(1),
  heroTitleEmphasis: z.string().min(1),
  heroTitleSuffix: z.string().min(1),
  heroSubtitle: z.string().min(1),
  footerAbout: z.string().min(1),
  contactEmail: z.string().min(1),
  contactPhone: z.string().min(1),
  contactAddress: z.string().min(1),
  siteDescription: z.string().min(1),
});

const mapSchema = z.object({
  center: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  zoom: z.number().int().min(1),
});

const modulesSchema = z.object({
  program: z.boolean(),
  supportCommittee: z.boolean(),
  membershipForm: z.boolean(),
  agenda: z.boolean(),
  blog: z.boolean(),
  proxy: z.boolean(),
  committees: z.boolean(),
  projects: z.boolean(),
  committeeWorksPublic: z.boolean(),
});

export const siteSettingsSchema = z.object({
  branding: brandingSchema,
  content: contentSchema,
  map: mapSchema,
  modules: modulesSchema,
});

export const siteSettingsSectionSchema = {
  [SiteSettingsSection.Branding]: brandingSchema,
  [SiteSettingsSection.Content]: contentSchema,
  [SiteSettingsSection.Map]: mapSchema,
  [SiteSettingsSection.Modules]: modulesSchema,
};

export const siteSettingsSections = [
  SiteSettingsSection.Branding,
  SiteSettingsSection.Content,
  SiteSettingsSection.Map,
  SiteSettingsSection.Modules,
] as const;

export function mergeSiteSettings(
  defaults: SiteSettings,
  overrides: Partial<SiteSettings>
): SiteSettings {
  return {
    branding: {
      ...defaults.branding,
      ...overrides.branding,
      colors: {
        ...defaults.branding.colors,
        ...overrides.branding?.colors,
      },
      images: {
        ...defaults.branding.images,
        ...overrides.branding?.images,
      },
    },
    content: {
      ...defaults.content,
      ...overrides.content,
    },
    map: {
      ...defaults.map,
      ...overrides.map,
      center: {
        ...defaults.map.center,
        ...overrides.map?.center,
      },
    },
    modules: {
      ...defaults.modules,
      ...overrides.modules,
    },
  };
}

export function isSiteSettingsSection(value: string): value is SiteSettingsSection {
  return siteSettingsSections.includes(value as SiteSettingsSection);
}

export function normalizeSiteSettingsValue<K extends SiteSettingsSection>(
  section: K,
  value: unknown,
  defaults: SiteSettingsByKey[K]
): SiteSettingsByKey[K] {
  const schema = siteSettingsSectionSchema[section];
  const parsed = schema.safeParse(value);
  if (parsed.success) {
    return parsed.data as SiteSettingsByKey[K];
  }
  return defaults;
}

export function normalizeSiteSettings(
  rows: { key: string; value: unknown }[]
): SiteSettings {
  const overrides: Partial<SiteSettings> = {};

  rows.forEach((row) => {
    if (!row?.key) return;

    if (isSiteSettingsSection(row.key)) {
      const section = row.key as SiteSettingsSection;
      overrides[section] = normalizeSiteSettingsValue(
        section,
        row.value,
        DEFAULT_SITE_SETTINGS[section]
      );
      return;
    }

    // Compat anciens réglages
    if (row.key === 'show_program') {
      overrides.modules = {
        ...(overrides.modules ?? {}),
        program: row.value === true || row.value === 'true' || (typeof row.value === 'object' && row.value !== null && 'enabled' in row.value ? (row.value as { enabled?: boolean }).enabled === true : false),
      };
    }

    if (row.key === 'show_committee_works') {
      overrides.modules = {
        ...(overrides.modules ?? {}),
        committeeWorksPublic: row.value === true || row.value === 'true' || (typeof row.value === 'object' && row.value !== null && 'enabled' in row.value ? (row.value as { enabled?: boolean }).enabled === true : false),
      };
    }

    if (row.key === 'site_name') {
      overrides.branding = { ...(overrides.branding ?? {}), name: String(row.value ?? '') };
    }

    if (row.key === 'site_description') {
      overrides.content = { ...(overrides.content ?? {}), siteDescription: String(row.value ?? '') };
    }

    if (row.key === 'contact_email') {
      overrides.content = { ...(overrides.content ?? {}), contactEmail: String(row.value ?? '') };
    }
  });

  return mergeSiteSettings(DEFAULT_SITE_SETTINGS, overrides);
}

function hexToHsl(value: string): string | null {
  const hex = value.replace('#', '');
  if (![3, 6].includes(hex.length)) return null;
  const normalized = hex.length === 3
    ? hex.split('').map((char) => char + char).join('')
    : hex;
  const int = parseInt(normalized, 16);
  if (Number.isNaN(int)) return null;
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);
  return `${hDeg} ${sPct}% ${lPct}%`;
}

export function applySiteTheme(settings: SiteSettings) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--site-green', settings.branding.colors.green);
  root.style.setProperty('--site-yellow', settings.branding.colors.yellow);
  root.style.setProperty('--site-orange', settings.branding.colors.orange);
  root.style.setProperty('--site-blue', settings.branding.colors.blue);
  root.style.setProperty('--site-red', settings.branding.colors.red);

  const accentHsl = hexToHsl(settings.branding.colors.green);
  if (accentHsl) {
    root.style.setProperty('--getigne-accent', accentHsl);
    root.style.setProperty('--primary', accentHsl);
    root.style.setProperty('--ring', accentHsl);
  }
}

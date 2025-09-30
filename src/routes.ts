/**
 * Routes de l'application
 * Centralise toutes les routes dans une enum pour faciliter la maintenance
 */
export enum Routes {
  // Routes publiques principales  
  HOME = "/",
  NEWS = "/news",
  NEWS_DETAIL = "/news/:slug",
  AGENDA = "/agenda",
  EVENT_DETAIL = "/agenda/:slug",
  NEIGHBORHOOD_EVENTS = "/cafes-de-quartier",
  NEIGHBORHOOD_KIT = "/cafes-de-quartier/kit",
  TEAM = "/equipe",
  COMMITTEES = "/comites",
  COMMITTEE_DETAIL = "/comites/:id",
  PROGRAM = "/programme",
  PROJECTS = "/projets",
  JOIN = "/nous-rejoindre",
  CONTACT = "/contact",
  LEGAL = "/mentions-legales",
  SITEMAP = "/plan-du-site",
  LIFT = "/lift",

  // Routes d'authentification
  AUTH = "/auth",
  AUTH_CALLBACK = "/auth/callback",
  AUTH_RESET_PASSWORD = "/auth/reset-password",
  PROFILE = "/profile",

  // Routes d'administration
  ADMIN = "/admin",
  ADMIN_NEWS = "/admin/news",
  ADMIN_NEWS_NEW = "/admin/news/new",
  ADMIN_NEWS_EDIT = "/admin/news/:id/edit",
  ADMIN_EVENTS = "/admin/events",
  ADMIN_EVENTS_NEW = "/admin/events/new",
  ADMIN_EVENTS_EDIT = "/admin/events/:id/edit",
  ADMIN_USERS = "/admin/users",
  ADMIN_PAGES = "/admin/pages",
  ADMIN_PAGES_NEW = "/admin/pages/new",
  ADMIN_PAGES_EDIT = "/admin/pages/:id/edit",
  ADMIN_COMMITTEES = "/admin/committees",
  ADMIN_COMMITTEES_NEW = "/admin/committees/new",
  ADMIN_COMMITTEES_EDIT = "/admin/committees/:id/edit",
  ADMIN_MENU = "/admin/menu",
  ADMIN_GALAXY = "/admin/galaxy",
  ADMIN_GALAXY_NEW = "/admin/galaxy/new",
  ADMIN_GALAXY_EDIT = "/admin/galaxy/:id/edit",
  ADMIN_PROGRAM = "/admin/program",
  ADMIN_PROGRAM_SECTIONS_INDEX = "/admin/program/edit",
  ADMIN_PROGRAM_EDIT = "/admin/program/:id/edit",
  ADMIN_PROJECTS = "/admin/projects",
  ADMIN_PROJECTS_NEW = "/admin/projects/new",
  ADMIN_PROJECTS_EDIT = "/admin/projects/:id/edit",
  ADMIN_SETTINGS = "/admin/settings",

  // Routes spéciales
  DYNAMIC_PAGE = "/:slug",
  NOT_FOUND = "*",
}

/**
 * Fonctions utilitaires pour générer des routes avec des paramètres
 */
export const generateRoutes = {
  newsDetail: (slug: string) => `/news/${slug}`,
  eventDetail: (slug: string) => `/agenda/${slug}`,
  committeeDetail: (id: string) => `/comites/${id}`,
  adminNewsEdit: (id: string) => `/admin/news/${id}/edit`,
  adminEventsEdit: (id: string) => `/admin/events/${id}/edit`,
  adminPagesEdit: (id: string) => `/admin/pages/${id}/edit`,
  adminCommitteesEdit: (id: string) => `/admin/committees/${id}/edit`,
  adminGalaxyEdit: (id: string) => `/admin/galaxy/${id}/edit`,
  adminProgramEdit: (id: string) => `/admin/program/${id}/edit`,
  adminProjectsEdit: (id: string) => `/admin/projects/${id}/edit`,
  dynamicPage: (slug: string) => `/${slug}`,
};

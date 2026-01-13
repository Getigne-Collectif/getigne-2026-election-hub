import { Database } from "@/integrations/supabase/types";

// Types de base depuis la base de données
export type ExternalGroup = Database["public"]["Tables"]["external_groups"]["Row"];
export type ExternalGroupInsert = Database["public"]["Tables"]["external_groups"]["Insert"];
export type ExternalGroupUpdate = Database["public"]["Tables"]["external_groups"]["Update"];

export type ExternalContact = Database["public"]["Tables"]["external_contacts"]["Row"];
export type ExternalContactInsert = Database["public"]["Tables"]["external_contacts"]["Insert"];
export type ExternalContactUpdate = Database["public"]["Tables"]["external_contacts"]["Update"];

export type ExternalContactGroup = Database["public"]["Tables"]["external_contact_groups"]["Row"];
export type ExternalContactGroupInsert = Database["public"]["Tables"]["external_contact_groups"]["Insert"];
export type ExternalContactGroupUpdate = Database["public"]["Tables"]["external_contact_groups"]["Update"];

// Types étendus avec jointures

/**
 * Contact externe avec ses groupes associés
 */
export interface ExternalContactWithGroups extends ExternalContact {
  groups: Array<{
    id: string;
    role: string | null;
    group: ExternalGroup;
  }>;
}

/**
 * Groupe externe avec ses contacts associés
 */
export interface ExternalGroupWithContacts extends ExternalGroup {
  contacts: Array<{
    id: string;
    role: string | null;
    contact: ExternalContact;
  }>;
}

/**
 * Type union pour l'affichage mixte dans l'annuaire
 * Permet de gérer à la fois les contacts et les groupes dans une même liste
 */
export type DirectoryEntry = 
  | { type: 'contact'; data: ExternalContactWithGroups }
  | { type: 'group'; data: ExternalGroupWithContacts };

/**
 * Statistiques pour l'affichage
 */
export interface DirectoryStats {
  totalContacts: number;
  totalGroups: number;
  contactsWithGroups: number;
  uniqueTags: string[];
}

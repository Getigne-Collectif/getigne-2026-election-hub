/**
 * Types pour le module procuration (demandes et volontaires)
 */

export type ProxyRequestType = 'requester' | 'volunteer';

export interface ProxyRequest {
  id: string;
  created_at: string;
  type: ProxyRequestType;
  first_name: string;
  last_name: string;
  national_elector_number: string;
  phone: string;
  email: string;
  voting_bureau: 1 | 2 | 3 | null;
  support_committee_consent: boolean;
  newsletter_consent: boolean;
  status: 'pending' | 'matched';
  disabled?: boolean;
}

export interface ProxyMatch {
  id: string;
  created_at: string;
  requester_id: string;
  volunteer_id: string;
  status: 'pending' | 'confirmed';
  confirmed_at: string | null;
  confirmed_by: string | null;
}

export interface ProxyRequestInsert {
  type: ProxyRequestType;
  first_name: string;
  last_name: string;
  national_elector_number: string;
  phone: string;
  email: string;
  voting_bureau?: 1 | 2 | 3 | null;
  support_committee_consent: boolean;
  newsletter_consent: boolean;
}

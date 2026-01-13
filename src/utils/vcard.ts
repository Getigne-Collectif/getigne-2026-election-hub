import type { TeamMember } from '@/types/electoral.types';

/**
 * Échappe les caractères spéciaux dans les vCards selon la RFC 6350
 */
function escapeVCardValue(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Formate une date pour vCard (YYYYMMDD)
 */
function formatVCardDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  } catch {
    return '';
  }
}

/**
 * Formate un numéro de téléphone pour vCard
 */
function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  // Nettoyer le numéro et ajouter le préfixe international si nécessaire
  let cleaned = phone.replace(/[\s\-\.]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '+33' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+33' + cleaned;
  }
  return cleaned;
}

/**
 * Parse le nom complet en prénom et nom de famille
 */
function parseName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

/**
 * Parse une adresse pour le format vCard ADR
 * Format: ;;rue;ville;région;code postal;pays
 */
function formatAddress(address: string | null | undefined): string {
  if (!address) return ';;;;;;';
  
  // Tentative de parser l'adresse française
  const parts = address.split(',').map(p => p.trim());
  let street = '';
  let city = '';
  let postalCode = '';
  const country = 'France';
  
  if (parts.length === 1) {
    street = parts[0];
  } else if (parts.length >= 2) {
    street = parts[0];
    const lastPart = parts[parts.length - 1];
    // Chercher un code postal (5 chiffres)
    const postalMatch = lastPart.match(/\b(\d{5})\b/);
    if (postalMatch) {
      postalCode = postalMatch[1];
      city = lastPart.replace(postalCode, '').trim();
    } else {
      city = lastPart;
    }
  }
  
  return `;;${escapeVCardValue(street)};${escapeVCardValue(city)};;${postalCode};${country}`;
}

/**
 * Génère le contenu vCard (RFC 6350) pour un membre de l'équipe
 */
export function generateVCard(member: TeamMember): string {
  const { firstName, lastName } = parseName(member.name);
  const lines: string[] = [];
  
  // En-tête vCard
  lines.push('BEGIN:VCARD');
  lines.push('VERSION:4.0');
  
  // Nom complet
  lines.push(`FN:${escapeVCardValue(member.name)}`);
  
  // Nom structuré (Nom;Prénom;Autre;Préfixe;Suffixe)
  lines.push(`N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`);
  
  // Email
  if (member.email) {
    lines.push(`EMAIL;TYPE=work:${escapeVCardValue(member.email)}`);
  }
  
  // Téléphone
  if (member.phone) {
    const formattedPhone = formatPhoneNumber(member.phone);
    lines.push(`TEL;TYPE=cell:${formattedPhone}`);
  }
  
  // Adresse
  if (member.address) {
    const formattedAddress = formatAddress(member.address);
    lines.push(`ADR;TYPE=work:${formattedAddress}`);
  }
  
  // Date de naissance
  if (member.birth_date) {
    const formattedDate = formatVCardDate(member.birth_date);
    if (formattedDate) {
      lines.push(`BDAY:${formattedDate}`);
    }
  }
  
  // Genre
  if (member.gender) {
    // Mapper les genres aux valeurs vCard standard
    const genderMap: Record<string, string> = {
      'homme': 'M',
      'femme': 'F',
      'autre': 'O',
    };
    const vCardGender = genderMap[member.gender.toLowerCase()] || 'U';
    lines.push(`GENDER:${vCardGender}`);
  }
  
  // Profession (titre)
  if (member.profession) {
    lines.push(`TITLE:${escapeVCardValue(member.profession)}`);
  }
  
  // Rôle dans l'équipe
  if (member.role) {
    lines.push(`ROLE:${escapeVCardValue(member.role)}`);
  }
  
  // Organisation
  lines.push('ORG:Gétigné Collectif');
  
  // Notes supplémentaires
  const notes: string[] = [];
  if (member.bio) {
    notes.push(`Bio: ${member.bio}`);
  }
  if (member.education_level) {
    const educationLabels: Record<string, string> = {
      'brevet': 'Brevet',
      'cap_bep': 'CAP/BEP',
      'bac_general': 'Bac Général',
      'bac_technologique': 'Bac Technologique',
      'bac_professionnel': 'Bac Professionnel',
      'bac_plus_1_2': 'Bac+1/2',
      'bac_plus_3': 'Bac+3',
      'bac_plus_4_5': 'Bac+4/5',
      'bac_plus_6_plus': 'Bac+6 et plus',
    };
    notes.push(`Niveau d'études: ${educationLabels[member.education_level] || member.education_level}`);
  }
  if (member.vignoble_arrival_year) {
    notes.push(`Arrivée dans le vignoble: ${member.vignoble_arrival_year}`);
  }
  if (member.is_board_member) {
    notes.push('Membre du bureau');
  }
  if (member.is_elected) {
    notes.push('Élu');
  }
  
  if (notes.length > 0) {
    lines.push(`NOTE:${escapeVCardValue(notes.join(' | '))}`);
  }
  
  // Photo (URL)
  if (member.image) {
    lines.push(`PHOTO;MEDIATYPE=image/jpeg:${member.image}`);
  }
  
  // Métadonnées
  lines.push(`REV:${new Date().toISOString()}`);
  lines.push(`UID:team-member-${member.id}`);
  
  // Fin vCard
  lines.push('END:VCARD');
  
  return lines.join('\r\n');
}

/**
 * Déclenche le téléchargement d'une vCard individuelle
 */
export function downloadVCard(member: TeamMember): void {
  const vCardContent = generateVCard(member);
  const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${member.name.replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Déclenche le téléchargement de vCards multiples dans un seul fichier
 * (Format vCard permet plusieurs cartes dans un seul fichier)
 */
export function downloadMultipleVCards(members: TeamMember[]): void {
  if (members.length === 0) return;
  
  const vCards = members.map(member => generateVCard(member));
  const combinedContent = vCards.join('\r\n');
  
  const blob = new Blob([combinedContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `annuaire_getigne_collectif_${members.length}_contacts.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Génère une URL de données pour une vCard (utile pour les QR codes)
 */
export function generateVCardDataUrl(member: TeamMember): string {
  const vCardContent = generateVCard(member);
  return `data:text/vcard;charset=utf-8,${encodeURIComponent(vCardContent)}`;
}

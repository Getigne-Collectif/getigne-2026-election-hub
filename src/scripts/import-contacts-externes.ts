/**
 * Script d'importation des contacts externes depuis un fichier CSV
 * 
 * Usage: 
 * 1. Assurez-vous d'avoir les variables d'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env
 * 2. Exécutez avec: yarn import:contacts
 * 
 * Structure attendue du CSV:
 * - Les lignes avec seulement le premier champ rempli en MAJUSCULES sont des catégories (tags)
 * - Les lignes avec Association + Contact + Tel + Mail sont des entrées
 * - La ville par défaut est "Gétigné"
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Charger les variables d'environnement
config();

// Configuration pour modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const CSV_PATH = join(__dirname, 'contacts-externes.csv');
const DEFAULT_CITY = 'Gétigné';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface ParsedEntry {
  association: string;
  contact: string;
  tel: string;
  mail: string;
  tag?: string;
}

/**
 * Parse le fichier CSV et extrait les entrées avec leurs tags
 */
function parseCSV(csvContent: string): ParsedEntry[] {
  const lines = csvContent.split('\n');
  const entries: ParsedEntry[] = [];
  let currentTag: string | undefined;

  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV en tenant compte des guillemets
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim());

    const [association, contact, tel, mail] = fields;

    // Détecter les catégories (tags)
    if (association && !contact && !tel && !mail) {
      // C'est une catégorie si elle est en majuscules ou commence par des espaces
      const trimmedAssoc = association.trim();
      if (trimmedAssoc === trimmedAssoc.toUpperCase() || association.startsWith(' ')) {
        currentTag = trimmedAssoc;
        console.log(`📁 Nouvelle catégorie détectée: ${currentTag}`);
        continue;
      }
    }

    // Entrée valide avec une association
    if (association && association.trim()) {
      entries.push({
        association: association.trim(),
        contact: contact?.trim() || '',
        tel: tel?.trim() || '',
        mail: mail?.trim() || '',
        tag: currentTag,
      });
    }
  }

  return entries;
}

/**
 * Extrait le prénom et nom d'un contact
 */
function parseContactName(contactStr: string): { firstName: string; lastName: string } {
  if (!contactStr) return { firstName: '', lastName: '' };

  // Enlever les mentions entre parenthèses (président, etc.)
  let cleanName = contactStr.replace(/\([^)]*\)/g, '').trim();
  
  // Enlever les préfixes M., Mme, etc.
  cleanName = cleanName.replace(/^(M\.|Mme|Monsieur|Madame)\s+/i, '').trim();

  // Séparer par espaces
  const parts = cleanName.split(/\s+/);
  
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  
  // Dernier mot = nom de famille, reste = prénom
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(' ');
  
  return { firstName, lastName };
}

/**
 * Nettoie le numéro de téléphone
 */
function cleanPhone(phone: string): string {
  if (!phone) return '';
  // Enlever tous les caractères sauf chiffres, espaces et points
  return phone.replace(/[^\d\s.]/g, '').trim();
}

/**
 * Nettoie l'email
 */
function cleanEmail(email: string): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

/**
 * Import principal
 */
async function importContacts() {
  console.log('🚀 Début de l\'importation des contacts externes\n');

  // 1. Lire le fichier CSV
  const csvContent = readFileSync(CSV_PATH, 'utf-8');
  const entries = parseCSV(csvContent);
  
  console.log(`📊 ${entries.length} entrées trouvées dans le CSV\n`);

  // 2. Regrouper par association
  const groupedByAssociation = new Map<string, ParsedEntry[]>();
  entries.forEach(entry => {
    if (!groupedByAssociation.has(entry.association)) {
      groupedByAssociation.set(entry.association, []);
    }
    groupedByAssociation.get(entry.association)!.push(entry);
  });

  console.log(`🏢 ${groupedByAssociation.size} associations uniques détectées\n`);

  let groupsCreated = 0;
  let contactsCreated = 0;
  let linksCreated = 0;
  const errors: string[] = [];

  // 3. Pour chaque association
  for (const [associationName, associationEntries] of groupedByAssociation) {
    console.log(`\n🏢 Traitement: ${associationName}`);
    
    // Récupérer le tag du premier contact
    const tag = associationEntries[0].tag;
    const tags = tag ? [tag] : [];

    try {
      // 3.1. Créer ou récupérer le groupe
      const { data: existingGroup } = await supabase
        .from('external_groups')
        .select('id')
        .eq('name', associationName)
        .single();

      let groupId: string;

      if (existingGroup) {
        console.log(`   ℹ️  Groupe existe déjà`);
        groupId = existingGroup.id;
      } else {
        const { data: newGroup, error: groupError } = await supabase
          .from('external_groups')
          .insert({
            name: associationName,
            city: DEFAULT_CITY,
            tags,
          })
          .select('id')
          .single();

        if (groupError || !newGroup) {
          console.error(`   ❌ Erreur création groupe: ${groupError?.message}`);
          errors.push(`Groupe ${associationName}: ${groupError?.message}`);
          continue;
        }

        groupId = newGroup.id;
        groupsCreated++;
        console.log(`   ✅ Groupe créé`);
      }

      // 3.2. Créer les contacts pour cette association
      for (const entry of associationEntries) {
        if (!entry.contact && !entry.tel && !entry.mail) {
          continue; // Pas de contact réel
        }

        const { firstName, lastName } = parseContactName(entry.contact);
        const phone = cleanPhone(entry.tel);
        const email = cleanEmail(entry.mail);

        // Trouver le rôle dans le nom du contact (entre parenthèses)
        const roleMatch = entry.contact.match(/\(([^)]+)\)/);
        const role = roleMatch ? roleMatch[1] : undefined;

        if (!firstName && !lastName && !phone && !email) {
          continue; // Rien à créer
        }

        try {
          // Créer le contact
          const { data: newContact, error: contactError } = await supabase
            .from('external_contacts')
            .insert({
              first_name: firstName || 'Contact',
              last_name: lastName || '',
              phone: phone || null,
              email: email || null,
              city: DEFAULT_CITY,
              tags,
            })
            .select('id')
            .single();

          if (contactError || !newContact) {
            console.error(`   ❌ Erreur création contact: ${contactError?.message}`);
            errors.push(`Contact ${firstName} ${lastName}: ${contactError?.message}`);
            continue;
          }

          contactsCreated++;
          console.log(`   👤 Contact créé: ${firstName} ${lastName}`);

          // Lier le contact au groupe
          const { error: linkError } = await supabase
            .from('external_contact_groups')
            .insert({
              contact_id: newContact.id,
              group_id: groupId,
              role,
            });

          if (linkError) {
            console.error(`   ❌ Erreur liaison: ${linkError.message}`);
            errors.push(`Liaison ${firstName} ${lastName} -> ${associationName}: ${linkError.message}`);
          } else {
            linksCreated++;
            if (role) {
              console.log(`   🔗 Lié au groupe (${role})`);
            } else {
              console.log(`   🔗 Lié au groupe`);
            }
          }
        } catch (err: any) {
          console.error(`   ❌ Erreur inattendue: ${err.message}`);
          errors.push(`Contact ${firstName} ${lastName}: ${err.message}`);
        }
      }
    } catch (err: any) {
      console.error(`   ❌ Erreur inattendue pour le groupe: ${err.message}`);
      errors.push(`Groupe ${associationName}: ${err.message}`);
    }
  }

  // 4. Résumé
  console.log('\n\n═══════════════════════════════════════');
  console.log('📊 RÉSUMÉ DE L\'IMPORTATION');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Groupes créés: ${groupsCreated}`);
  console.log(`✅ Contacts créés: ${contactsCreated}`);
  console.log(`✅ Liaisons créées: ${linksCreated}`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} erreur(s):`);
    errors.forEach(err => console.log(`   - ${err}`));
  } else {
    console.log('\n🎉 Importation terminée sans erreur !');
  }
}

// Exécution
importContacts().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});

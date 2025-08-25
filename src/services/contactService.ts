import { DatabaseConnection } from '../database/connection';
import { Contact, ContactGroup, ContactMatch, IdentifyResponse } from '../types';

export class ContactService {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async identifyContact(email?: string | null, phoneNumber?: string | null): Promise<IdentifyResponse> {
    try {
      // Find existing contacts that match the provided email or phone
      const matchingContacts = await this.findMatchingContacts(email, phoneNumber);

      if (matchingContacts.length === 0) {
        // No matches found, create a new primary contact
        const newContact = await this.createPrimaryContact(email, phoneNumber);
        return this.buildResponse(newContact, []);
      }

      // Group contacts by their primary contact
      const contactGroups = await this.groupContactsByPrimary(matchingContacts);

      if (contactGroups.length === 1) {
        // All matches belong to the same group
        const group = contactGroups[0];
        if (!group) {
          throw new Error('Failed to get contact group');
        }
        
        const shouldCreateSecondary = this.shouldCreateSecondaryContact(group, email, phoneNumber);

        if (shouldCreateSecondary) {
          const secondaryContact = await this.createSecondaryContact(
            group.primaryContact.id,
            email,
            phoneNumber
          );
          group.secondaryContacts.push(secondaryContact);
        }

        return this.buildResponse(group.primaryContact, group.secondaryContacts);
      } else {
        // Multiple groups found, need to merge them
        return await this.mergeContactGroups(contactGroups, email, phoneNumber);
      }
    } catch (error) {
      console.error('Error in identifyContact:', error);
      throw error;
    }
  }

  private async findMatchingContacts(email?: string | null, phoneNumber?: string | null): Promise<ContactMatch[]> {
    const conditions = [];
    const params = [];

    if (email) {
        conditions.push('email = ?');
        params.push(email);
    }
    
    if (phoneNumber) {
        conditions.push('phoneNumber = ?');
        params.push(phoneNumber);
    }

    const whereClause = conditions.length > 0 ? `WHERE (${conditions.join(' OR ')}) AND deletedAt IS NULL` : 'WHERE deletedAt IS NULL';
    
    const sql = `
      SELECT id, phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt, deletedAt
      FROM contacts
      ${whereClause}
      ORDER BY createdAt ASC
    `;

    const contacts = await this.db.query<Contact>(sql, params);

    return contacts.map(contact => ({
      contact,
      matchType: this.getMatchType(contact, email, phoneNumber),
      linkPrecedence: contact.linkPrecedence,
    }));
  }

  private getMatchType(contact: Contact, email?: string | null, phoneNumber?: string | null): 'email' | 'phone' | 'both' {
    const hasEmailMatch = email !== null && email !== undefined && contact.email === email;
    const hasPhoneMatch = phoneNumber !== null && phoneNumber !== undefined && contact.phoneNumber === phoneNumber;

    if (hasEmailMatch && hasPhoneMatch) return 'both';
    if (hasEmailMatch) return 'email';
    return 'phone';
  }

  private async groupContactsByPrimary(matchingContacts: ContactMatch[]): Promise<ContactGroup[]> {
    if (matchingContacts.length === 0) return [];

    const contactIds = matchingContacts.map(mc => mc.contact.id);
    let placeholders = contactIds.map(() => '?').join(',');
    const secondaryContacts = matchingContacts.filter(l=>l.linkPrecedence == "secondary")
    if(secondaryContacts.length > 0) {
     placeholders = placeholders + "," + secondaryContacts.map(l=>l.contact.linkedId).join(',');
    }
    
    const sql = `
      SELECT id, phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt, deletedAt
      FROM contacts
      WHERE (id IN (${placeholders}) OR linkedId IN (${placeholders})) AND deletedAt IS NULL
      ORDER BY createdAt ASC
    `;

    const allRelatedContacts = await this.db.query<Contact>(sql, [...contactIds, ...contactIds]);

    const contactMap = new Map<number, Contact>();
    allRelatedContacts.forEach(contact => {
      contactMap.set(contact.id, contact);
    });

    const groups = new Map<number, ContactGroup>();

    for (const contact of allRelatedContacts) {
      const primaryId = this.findPrimaryContactId(contact, contactMap);
      
      if (!groups.has(primaryId)) {
        const primaryContact = contactMap.get(primaryId);
        if (primaryContact) {
          groups.set(primaryId, {
            primaryContact,
            secondaryContacts: [],
          });
        }
      }

      if (contact.id !== primaryId) {
        const group = groups.get(primaryId);
        const contactToAdd = contactMap.get(contact.id);
        if (group && contactToAdd) {
          group.secondaryContacts.push(contactToAdd);
        }
      }
    }

    return Array.from(groups.values());
  }

  private validateContactStructure(contact: Contact, contactMap: Map<number, Contact>, visited: Set<number> = new Set()): boolean {
    // If we've already visited this contact, it's a circular reference
    if (visited.has(contact.id)) {
      console.warn(`Circular reference detected for contact ID: ${contact.id}`);
      return false;
    }

    visited.add(contact.id);

    // If this is a secondary contact, validate its linked contact
    if (contact.linkPrecedence === 'secondary' && contact.linkedId) {
      const linkedContact = contactMap.get(contact.linkedId);
      if (linkedContact) {
        return this.validateContactStructure(linkedContact, contactMap, visited);
      } else {
        console.warn(`Linked contact ${contact.linkedId} not found for contact ${contact.id}`);
        return false;
      }
    }

    return true;
  }

  private findPrimaryContactId(contact: Contact, contactMap: Map<number, Contact>, visited: Set<number> = new Set()): number {
    if (contact.linkPrecedence === 'primary') {
      return contact.id;
    }

    // Prevent infinite recursion by tracking visited contacts
    if (visited.has(contact.id)) {
      console.warn(`Circular reference detected for contact ID: ${contact.id}, returning current ID`);
      return contact.id;
    }

    visited.add(contact.id);

    if (contact.linkedId) {
      const linkedContact = contactMap.get(contact.linkedId);
      if (linkedContact) {
        return this.findPrimaryContactId(linkedContact, contactMap, visited);
      }
    }

    return contact.id;
  }

  private shouldCreateSecondaryContact(group: ContactGroup, email?: string | null, phoneNumber?: string | null): boolean {
    const hasNewEmail = email !== null && email !== undefined && 
                       group.primaryContact.email !== email && 
                       !group.secondaryContacts.some(c => c.email === email);
    const hasNewPhone = phoneNumber !== null && phoneNumber !== undefined && 
                       group.primaryContact.phoneNumber !== phoneNumber && 
                       !group.secondaryContacts.some(c => c.phoneNumber === phoneNumber);

    return Boolean(hasNewEmail || hasNewPhone);
  }

  private async createPrimaryContact(email?: string | null, phoneNumber?: string | null): Promise<Contact> {
    const sql = `
      INSERT INTO contacts (email, phoneNumber, linkPrecedence, createdAt, updatedAt)
      VALUES (?, ?, 'primary', NOW(), NOW())
    `;

    const result = await this.db.execute(sql, [email || null, phoneNumber || null]);
    
    const contact = await this.db.queryOne<Contact>(
      'SELECT * FROM contacts WHERE id = ?',
      [result.insertId]
    );

    if (!contact) {
      throw new Error('Failed to create primary contact');
    }

    return contact;
  }

  private async createSecondaryContact(primaryId: number, email?: string | null, phoneNumber?: string | null): Promise<Contact> {
    const sql = `
      INSERT INTO contacts (email, phoneNumber, linkedId, linkPrecedence, createdAt, updatedAt)
      VALUES (?, ?, ?, 'secondary', NOW(), NOW())
    `;

    const result = await this.db.execute(sql, [email || null, phoneNumber || null, primaryId]);
    
    const contact = await this.db.queryOne<Contact>(
      'SELECT * FROM contacts WHERE id = ?',
      [result.insertId]
    );

    if (!contact) {
      throw new Error('Failed to create secondary contact');
    }

    return contact;
  }

  private async mergeContactGroups(groups: ContactGroup[], email?: string | null, phoneNumber?: string | null): Promise<IdentifyResponse> {
    // Sort groups by primary contact creation date to find the oldest
    groups.sort((a, b) => a.primaryContact.createdAt.getTime() - b.primaryContact.createdAt.getTime());
    
    const oldestGroup = groups[0];
    if (!oldestGroup) {
      throw new Error('No contact groups found to merge');
    }
    
    const otherGroups = groups.slice(1);

    // Update all secondary contacts in other groups to link to the oldest primary
    for (const group of otherGroups) {
      // Update the primary contact of this group to be secondary
      await this.db.execute(
        'UPDATE contacts SET linkedId = ?, linkPrecedence = ?, updatedAt = NOW() WHERE id = ?',
        [oldestGroup.primaryContact.id, 'secondary', group.primaryContact.id]
      );

      // Update all secondary contacts to link to the new primary
      for (const secondaryContact of group.secondaryContacts) {
        await this.db.execute(
          'UPDATE contacts SET linkedId = ?, updatedAt = NOW() WHERE id = ?',
          [oldestGroup.primaryContact.id, secondaryContact.id]
        );
      }
    }

    // Check if we need to create a new secondary contact
    const shouldCreateSecondary = this.shouldCreateSecondaryContact(oldestGroup, email, phoneNumber);

    if (shouldCreateSecondary) {
      await this.createSecondaryContact(
        oldestGroup.primaryContact.id,
        email,
        phoneNumber
      );
    }

    // Fetch updated data
    const updatedGroup = await this.getContactGroup(oldestGroup.primaryContact.id);
    
    return this.buildResponse(
      updatedGroup.primaryContact,
      updatedGroup.secondaryContacts
    );
  }

  private async getContactGroup(primaryId: number): Promise<ContactGroup> {
    const primaryContact = await this.db.queryOne<Contact>(
      'SELECT * FROM contacts WHERE id = ?',
      [primaryId]
    );

    if (!primaryContact) {
      throw new Error(`Primary contact with id ${primaryId} not found`);
    }

    const secondaryContacts = await this.db.query<Contact>(
      'SELECT * FROM contacts WHERE linkedId = ? AND deletedAt IS NULL ORDER BY createdAt ASC',
      [primaryId]
    );

    return {
      primaryContact,
      secondaryContacts,
    };
  }

  private buildResponse(primaryContact: Contact, secondaryContacts: Contact[]): IdentifyResponse {
    const emails = new Array(...new Set([primaryContact.email, ...secondaryContacts.map(c => c.email)]))
      .filter((email): email is string => email !== null && email !== undefined);

    const phoneNumbers = new Array(...new Set([primaryContact.phoneNumber, ...secondaryContacts.map(c => c.phoneNumber)]))
      .filter((phone): phone is string => phone !== null && phone !== undefined);

    const secondaryContactIds = secondaryContacts.map(c => c.id);

    return {
      contact: {
        primaryContatctId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds,
      },
    };
  }

  async disconnect(): Promise<void> {
    await this.db.close();
  }
} 
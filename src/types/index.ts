export interface IdentifyRequest {
  email?: string;
  phoneNumber?: string;
}

export interface ContactResponse {
  primaryContatctId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

export interface IdentifyResponse {
  contact: ContactResponse;
}

export interface Contact {
  id: number;
  phoneNumber: string | null;
  email: string | null;
  linkedId: number | null;
  linkPrecedence: 'primary' | 'secondary';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ContactGroup {
  primaryContact: Contact;
  secondaryContacts: Contact[];
}

export interface ContactMatch {
  contact: Contact;
  matchType: 'email' | 'phone' | 'both';
  linkPrecedence: 'primary' | 'secondary';
} 
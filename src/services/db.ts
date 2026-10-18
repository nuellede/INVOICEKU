import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  collectionGroup,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  Business,
  Client,
  ServiceItem,
  Invoice,
  Payment,
  Member,
  Invitation,
  SharedInvoice,
  UserProfile,
  AuditLog,
  WorkspaceType,
} from '../types';
import { generateSecureToken } from '../utils/formatters';

// Default Video Production services for Indonesian creative market
export const DEFAULT_VIDEO_SERVICES: Omit<ServiceItem, 'id' | 'businessId' | 'createdAt'>[] = [
  {
    name: 'Director of Photography (DP) & Kamera Utama',
    category: 'Production',
    description: 'Jasa Sinematografer / DP include monitoring director, rigging, & lighting direction (1 Shift = Max 10 Jam).',
    unit: 'shift',
    defaultPrice: 3500000,
  },
  {
    name: 'Camera Package (Sony FX3 / FX6 Cinema Line)',
    category: 'Equipment',
    description: 'Sewa body kamera Sony FX3/FX6 + Prime GM Lens kit (24mm, 35mm, 50mm, 85mm), V-Mount batteries, filter VND.',
    unit: 'hari',
    defaultPrice: 2000000,
  },
  {
    name: 'Drone Aerial 4K Shooting (DJI Mavic 3 Cine)',
    category: 'Production',
    description: 'Pengambilan gambar udara resolusi 4K/5.1K ProRes include pilot bersertifikat FASI (1-2 baterai flight).',
    unit: 'shift',
    defaultPrice: 2500000,
  },
  {
    name: 'Sound Recordist & Wireless Lav/Boom Kit',
    category: 'Sound',
    description: 'Operator audio location recordist + 2x Sennheiser Wireless Mics + Rode NTG3 shotgun mic & Zoom F6 32-bit float.',
    unit: 'shift',
    defaultPrice: 1800000,
  },
  {
    name: 'Lighting Package (Aputure 600d + 300x + Dome)',
    category: 'Equipment',
    description: 'Paket lampu key & fill light Aputure 600d Pro, Amaran 200x, C-Stand, Softbox Light Dome 150, & Gaffer.',
    unit: 'shift',
    defaultPrice: 2200000,
  },
  {
    name: 'Video Editing & Rough Cut (Premiere Pro)',
    category: 'Post-Production',
    description: 'Proses offline editing, penyusunan alur cerita, sinkronisasi audio, pacing, & rough cut review.',
    unit: 'project',
    defaultPrice: 4000000,
  },
  {
    name: 'Color Grading (DaVinci Resolve Studio)',
    category: 'Post-Production',
    description: 'Advanced color grading, mood matching, skin-tone refinement, HDR/Rec.709 mastering pada DaVinci Resolve.',
    unit: 'project',
    defaultPrice: 3000000,
  },
  {
    name: 'Motion Graphics, Titles & Subtitles',
    category: 'Post-Production',
    description: 'Pembuatan bumper intro/outro, lower third, typography animasi, dan subtitle bahasa Indonesia/Inggris.',
    unit: 'project',
    defaultPrice: 2000000,
  },
  {
    name: 'Sound Design, Mixing & Foley Master',
    category: 'Sound',
    description: 'Penataan sound effects (SFX), ambiance, balance voiceover, mastering LUFS standard YouTube/Broadcast.',
    unit: 'project',
    defaultPrice: 1750000,
  },
  {
    name: 'Scriptwriting & Storyboard Concept',
    category: 'Pre-Production',
    description: 'Penulisan naskah video komersial/corporate profile, treatment visual, dan breakdown adegan.',
    unit: 'project',
    defaultPrice: 2500000,
  },
];

// USER PROFILE
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// USER WORKSPACES
export async function getUserMemberships(userId: string): Promise<Member[]> {
  // 1. Check user profile document first (direct read, never fails collection group permissions or index constraints)
  let profileMemberships: Member[] = [];
  try {
    const profSnap = await getDoc(doc(db, 'users', userId));
    if (profSnap.exists()) {
      const data = profSnap.data();
      if (Array.isArray(data.memberships) && data.memberships.length > 0) {
        profileMemberships = data.memberships as Member[];
      } else if (data.defaultBusinessId) {
        profileMemberships = [
          {
            userId,
            businessId: data.defaultBusinessId,
            email: data.email || '',
            name: data.displayName || 'Owner',
            role: 'owner',
            joinedAt: data.createdAt || new Date().toISOString(),
          },
        ];
      }
    }
  } catch (e) {
    console.warn('Profile read fallback notice:', e);
  }

  // 2. Query collectionGroup 'members'
  const path = 'members (collectionGroup)';
  try {
    const q = query(collectionGroup(db, 'members'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as Member);
    if (list.length > 0) {
      try {
        await updateDoc(doc(db, 'users', userId), { memberships: list });
      } catch {
        // ignore update errors
      }
      return list;
    }
    return profileMemberships;
  } catch (error) {
    console.warn('CollectionGroup members query notice:', error);
    // If profile has memberships or defaultBusinessId, use it seamlessly without breaking UI
    if (profileMemberships.length > 0) {
      return profileMemberships;
    }
    // If no fallback available, throw contextual error
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// BUSINESS WORKSPACE
export async function getBusiness(businessId: string): Promise<Business | null> {
  const path = `businesses/${businessId}`;
  try {
    const snap = await getDoc(doc(db, 'businesses', businessId));
    if (snap.exists()) {
      return snap.data() as Business;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createBusinessWorkspace(
  businessData: {
    name: string;
    type: WorkspaceType;
    email: string;
    phone: string;
    address: string;
    website?: string;
    npwp?: string;
    logoUrl?: string;
    currency?: string;
    invoicePrefix?: string;
    defaultPaymentTermsDays?: number;
    defaultTemplate?: 'corporate' | 'minimalist' | 'creative';
    ppnEnabled?: boolean;
    ppnRate?: number;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
    defaultNotes?: string;
  },
  owner: { uid: string; email: string; displayName?: string }
): Promise<Business> {
  const businessId = 'biz_' + generateSecureToken(16);
  const now = new Date().toISOString();

  const business: Business = {
    id: businessId,
    name: businessData.name,
    type: businessData.type,
    ownerId: owner.uid,
    ownerEmail: owner.email,
    email: businessData.email,
    phone: businessData.phone,
    address: businessData.address,
    website: businessData.website || '',
    npwp: businessData.npwp || '',
    logoUrl: businessData.logoUrl || '',
    currency: businessData.currency || 'IDR',
    invoicePrefix: businessData.invoicePrefix || `INV/${new Date().getFullYear()}/`,
    nextInvoiceNumber: 1,
    defaultPaymentTermsDays: businessData.defaultPaymentTermsDays || 14,
    defaultTemplate: businessData.defaultTemplate || 'creative',
    ppnEnabled: businessData.ppnEnabled ?? false,
    ppnRate: businessData.ppnRate || 11,
    bankName: businessData.bankName || 'BCA',
    bankAccountNumber: businessData.bankAccountNumber || '',
    bankAccountHolder: businessData.bankAccountHolder || '',
    defaultNotes:
      businessData.defaultNotes ||
      'Pembayaran mohon ditransfer sesuai rincian rekening tertera. Harap konfirmasi bukti transfer via WhatsApp.',
    createdAt: now,
    updatedAt: now,
  };

  const member: Member = {
    userId: owner.uid,
    businessId,
    email: owner.email,
    name: owner.displayName || owner.email.split('@')[0],
    role: 'owner',
    joinedAt: now,
  };

  try {
    // 1. Create Business
    await setDoc(doc(db, 'businesses', businessId), business);

    // 2. Create Owner Member
    await setDoc(doc(db, `businesses/${businessId}/members`, owner.uid), member);

    // 3. Seed Default Video Production Services
    for (const service of DEFAULT_VIDEO_SERVICES) {
      const sId = 'srv_' + generateSecureToken(12);
      const serviceDoc: ServiceItem = {
        ...service,
        id: sId,
        businessId,
        createdAt: now,
      };
      await setDoc(doc(db, `businesses/${businessId}/serviceCatalog`, sId), serviceDoc);
    }

    // 4. Update user profile default business and memberships
    await saveUserProfile({
      uid: owner.uid,
      email: owner.email,
      displayName: owner.displayName || owner.email.split('@')[0],
      defaultBusinessId: businessId,
      memberships: [member],
      createdAt: now,
      updatedAt: now,
    });

    return business;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `businesses/${businessId}`);
  }
}

export async function updateBusiness(businessId: string, updates: Partial<Business>): Promise<void> {
  const path = `businesses/${businessId}`;
  try {
    const finalUpdates = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(doc(db, 'businesses', businessId), finalUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// MEMBERS
export async function getBusinessMembers(businessId: string): Promise<Member[]> {
  const path = `businesses/${businessId}/members`;
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => d.data() as Member);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateMemberRole(businessId: string, memberId: string, role: Member['role']): Promise<void> {
  const path = `businesses/${businessId}/members/${memberId}`;
  try {
    await updateDoc(doc(db, path), { role });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeMember(businessId: string, memberId: string): Promise<void> {
  const path = `businesses/${businessId}/members/${memberId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// INVITATIONS
export async function createInvitation(
  businessId: string,
  businessName: string,
  email: string,
  role: Member['role'],
  inviter: { uid: string; email: string }
): Promise<Invitation> {
  const invId = 'inv_' + generateSecureToken(16);
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const inv: Invitation = {
    id: invId,
    businessId,
    businessName,
    email: email.toLowerCase().trim(),
    role,
    invitedBy: inviter.uid,
    invitedByEmail: inviter.email,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  try {
    await setDoc(doc(db, 'invitations', invId), inv);
    return inv;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `invitations/${invId}`);
  }
}

export async function getPendingInvitationsForEmail(email: string): Promise<Invitation[]> {
  const path = 'invitations';
  try {
    const q = query(collection(db, path), where('email', '==', email.toLowerCase().trim()), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Invitation);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function acceptInvitation(invitation: Invitation, user: { uid: string; email: string; displayName?: string }): Promise<void> {
  const memberPath = `businesses/${invitation.businessId}/members/${user.uid}`;
  const invPath = `invitations/${invitation.id}`;
  const now = new Date().toISOString();

  const member: Member = {
    userId: user.uid,
    businessId: invitation.businessId,
    email: user.email,
    name: user.displayName || user.email.split('@')[0],
    role: invitation.role,
    invitedBy: invitation.invitedBy,
    joinedAt: now,
  };

  try {
    // 1. Add as member
    await setDoc(doc(db, memberPath), member);
    // 2. Update invitation status
    await updateDoc(doc(db, invPath), { status: 'accepted' });
    // 3. Update user profile memberships
    try {
      const prof = await getUserProfile(user.uid);
      if (prof) {
        const existing = prof.memberships || [];
        const filtered = existing.filter((m) => m.businessId !== invitation.businessId);
        await saveUserProfile({
          ...prof,
          defaultBusinessId: prof.defaultBusinessId || invitation.businessId,
          memberships: [...filtered, member],
        });
      }
    } catch {
      // ignore
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, memberPath);
  }
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const path = `invitations/${invitationId}`;
  try {
    await updateDoc(doc(db, path), { status: 'revoked' });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// CLIENTS
export async function getClients(businessId: string): Promise<Client[]> {
  const path = `businesses/${businessId}/clients`;
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Client);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createClient(businessId: string, clientData: Omit<Client, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>): Promise<Client> {
  const cId = 'cli_' + generateSecureToken(12);
  const now = new Date().toISOString();
  const client: Client = {
    ...clientData,
    id: cId,
    businessId,
    createdAt: now,
    updatedAt: now,
  };
  const path = `businesses/${businessId}/clients/${cId}`;
  try {
    await setDoc(doc(db, path), client);
    return client;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateClient(businessId: string, clientId: string, updates: Partial<Client>): Promise<void> {
  const path = `businesses/${businessId}/clients/${clientId}`;
  try {
    await updateDoc(doc(db, path), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteClient(businessId: string, clientId: string): Promise<void> {
  const path = `businesses/${businessId}/clients/${clientId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// SERVICE CATALOG
export async function getServices(businessId: string): Promise<ServiceItem[]> {
  const path = `businesses/${businessId}/serviceCatalog`;
  try {
    const q = query(collection(db, path), orderBy('category', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ServiceItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createService(businessId: string, serviceData: Omit<ServiceItem, 'id' | 'businessId' | 'createdAt'>): Promise<ServiceItem> {
  const sId = 'srv_' + generateSecureToken(12);
  const now = new Date().toISOString();
  const service: ServiceItem = {
    ...serviceData,
    id: sId,
    businessId,
    createdAt: now,
  };
  const path = `businesses/${businessId}/serviceCatalog/${sId}`;
  try {
    await setDoc(doc(db, path), service);
    return service;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateService(businessId: string, serviceId: string, updates: Partial<ServiceItem>): Promise<void> {
  const path = `businesses/${businessId}/serviceCatalog/${serviceId}`;
  try {
    await updateDoc(doc(db, path), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteService(businessId: string, serviceId: string): Promise<void> {
  const path = `businesses/${businessId}/serviceCatalog/${serviceId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// INVOICES
export async function getInvoices(businessId: string): Promise<Invoice[]> {
  const path = `businesses/${businessId}/invoices`;
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Invoice);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getInvoice(businessId: string, invoiceId: string): Promise<Invoice | null> {
  const path = `businesses/${businessId}/invoices/${invoiceId}`;
  try {
    const snap = await getDoc(doc(db, path));
    if (snap.exists()) {
      return snap.data() as Invoice;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createInvoice(
  businessId: string,
  invoiceData: Omit<Invoice, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>,
  business: Business
): Promise<Invoice> {
  const invId = 'inv_' + generateSecureToken(14);
  const now = new Date().toISOString();
  const invoice: Invoice = {
    ...invoiceData,
    id: invId,
    businessId,
    createdAt: now,
    updatedAt: now,
  };
  const path = `businesses/${businessId}/invoices/${invId}`;
  try {
    await setDoc(doc(db, path), invoice);
    // Increment next invoice number
    await updateDoc(doc(db, `businesses/${businessId}`), {
      nextInvoiceNumber: (business.nextInvoiceNumber || 1) + 1,
    });
    return invoice;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateInvoice(businessId: string, invoiceId: string, updates: Partial<Invoice>): Promise<void> {
  const path = `businesses/${businessId}/invoices/${invoiceId}`;
  try {
    await updateDoc(doc(db, path), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteInvoice(businessId: string, invoiceId: string): Promise<void> {
  const path = `businesses/${businessId}/invoices/${invoiceId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// PAYMENTS
export async function getPayments(businessId: string, invoiceId?: string): Promise<Payment[]> {
  const path = `businesses/${businessId}/payments`;
  try {
    let q = query(collection(db, path), orderBy('createdAt', 'desc'));
    if (invoiceId) {
      q = query(collection(db, path), where('invoiceId', '==', invoiceId), orderBy('createdAt', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Payment);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function recordPayment(
  businessId: string,
  invoice: Invoice,
  paymentData: {
    amount: number;
    date: string;
    method: string;
    reference?: string;
    notes?: string;
  },
  userId: string
): Promise<Payment> {
  const pId = 'pay_' + generateSecureToken(12);
  const now = new Date().toISOString();
  const payment: Payment = {
    id: pId,
    businessId,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    amount: paymentData.amount,
    date: paymentData.date,
    method: paymentData.method,
    reference: paymentData.reference || '',
    notes: paymentData.notes || '',
    recordedBy: userId,
    createdAt: now,
  };

  const newPaidAmount = (invoice.paidAmount || 0) + paymentData.amount;
  const newOutstanding = Math.max(0, invoice.grandTotal - newPaidAmount);
  const newStatus = newOutstanding <= 0 ? 'paid' : 'partially_paid';

  try {
    // 1. Record payment doc
    await setDoc(doc(db, `businesses/${businessId}/payments`, pId), payment);

    // 2. Update invoice status & amounts
    await updateDoc(doc(db, `businesses/${businessId}/invoices`, invoice.id), {
      paidAmount: newPaidAmount,
      outstandingAmount: newOutstanding,
      status: newStatus,
      updatedAt: now,
    });

    return payment;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `businesses/${businessId}/payments/${pId}`);
  }
}

// PRIVATE INVOICE SHARING (Unguessable token)
export async function createSharedInvoice(
  business: Business,
  invoice: Invoice
): Promise<string> {
  const shareToken = generateSecureToken(32);
  const payload: SharedInvoice = {
    token: shareToken,
    businessId: business.id,
    invoiceId: invoice.id,
    invoiceData: JSON.stringify({
      invoice,
      business: {
        name: business.name,
        type: business.type,
        email: business.email,
        phone: business.phone,
        address: business.address,
        website: business.website,
        npwp: business.npwp,
        logoUrl: business.logoUrl,
        bankName: business.bankName,
        bankAccountNumber: business.bankAccountNumber,
        bankAccountHolder: business.bankAccountHolder,
      },
    }),
    active: true,
    createdAt: new Date().toISOString(),
  };

  const path = `sharedInvoices/${shareToken}`;
  try {
    await setDoc(doc(db, path), payload);
    // save token on invoice
    await updateInvoice(business.id, invoice.id, { shareToken });
    return shareToken;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getSharedInvoice(token: string): Promise<SharedInvoice | null> {
  const path = `sharedInvoices/${token}`;
  try {
    const snap = await getDoc(doc(db, path));
    if (snap.exists()) {
      const data = snap.data() as SharedInvoice;
      if (data.active) {
        return data;
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function revokeSharedInvoice(token: string): Promise<void> {
  const path = `sharedInvoices/${token}`;
  try {
    await updateDoc(doc(db, path), { active: false });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// AUDIT LOGGING
export async function logAudit(
  businessId: string,
  action: string,
  actorId: string,
  actorEmail: string,
  details: string
): Promise<void> {
  const logId = 'log_' + generateSecureToken(12);
  const log: AuditLog = {
    id: logId,
    businessId,
    action,
    actorId,
    actorEmail,
    details,
    timestamp: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, `businesses/${businessId}/auditLogs`, logId), log);
  } catch (e) {
    console.warn('Failed to record audit log', e);
  }
}

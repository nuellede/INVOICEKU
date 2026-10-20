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

// BUSINESSES BY OWNER DIRECT QUERY
export async function getBusinessesByOwner(userId: string): Promise<Business[]> {
  try {
    const q = query(collection(db, 'businesses'), where('ownerId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Business);
  } catch (error) {
    console.warn('Failed to query businesses by owner:', error);
    return [];
  }
}

// BUSINESSES BY OWNER EMAIL DIRECT QUERY
export async function getBusinessesByEmail(email: string): Promise<Business[]> {
  if (!email) return [];
  try {
    const cleanEmail = email.toLowerCase().trim();
    const q = query(collection(db, 'businesses'), where('ownerEmail', '==', cleanEmail));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Business);
  } catch (error) {
    console.warn('Failed to query businesses by ownerEmail:', error);
    return [];
  }
}

// USER WORKSPACES DISCOVERY
export async function getUserMemberships(userId: string, userEmail?: string): Promise<Member[]> {
  const membershipsMap = new Map<string, Member>();

  // 1. Direct query businesses owned by this user (Primary, fast, authoritative)
  try {
    const ownedBizs = await getBusinessesByOwner(userId);
    for (const biz of ownedBizs) {
      membershipsMap.set(biz.id, {
        userId,
        businessId: biz.id,
        email: biz.ownerEmail || userEmail || '',
        name: biz.name || 'Owner',
        role: 'owner',
        joinedAt: biz.createdAt || new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn('Owned businesses check notice:', e);
  }

  // 2. Direct query businesses by owner email (handles re-registration or UID drift)
  if (userEmail) {
    try {
      const emailBizs = await getBusinessesByEmail(userEmail);
      for (const biz of emailBizs) {
        if (!membershipsMap.has(biz.id)) {
          membershipsMap.set(biz.id, {
            userId,
            businessId: biz.id,
            email: biz.ownerEmail || userEmail,
            name: biz.name || 'Owner',
            role: 'owner',
            joinedAt: biz.createdAt || new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      console.warn('Email businesses check notice:', e);
    }
  }

  // 3. Check user profile document (contains memberships array & defaultBusinessId)
  try {
    const profSnap = await getDoc(doc(db, 'users', userId));
    if (profSnap.exists()) {
      const data = profSnap.data();
      if (Array.isArray(data.memberships)) {
        for (const m of data.memberships) {
          if (m && m.businessId) membershipsMap.set(m.businessId, m);
        }
      }
      if (data.defaultBusinessId && !membershipsMap.has(data.defaultBusinessId)) {
        membershipsMap.set(data.defaultBusinessId, {
          userId,
          businessId: data.defaultBusinessId,
          email: data.email || userEmail || '',
          name: data.displayName || 'Owner',
          role: 'owner',
          joinedAt: data.createdAt || new Date().toISOString(),
        });
      }
    }
  } catch (e) {
    console.warn('Profile read fallback notice:', e);
  }

  // 4. Query collectionGroup 'members' (for invited team memberships)
  try {
    const q = query(collectionGroup(db, 'members'), where('userId', '==', userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const m = d.data() as Member;
      if (m && m.businessId) membershipsMap.set(m.businessId, m);
    }
  } catch (error) {
    console.warn('CollectionGroup members query notice:', error);
  }

  // 5. LocalStorage fallback if available
  if (membershipsMap.size === 0 && typeof window !== 'undefined') {
    try {
      const cachedBizId = localStorage.getItem('cineinvoice_active_biz_' + userId);
      if (cachedBizId) {
        membershipsMap.set(cachedBizId, {
          userId,
          businessId: cachedBizId,
          email: userEmail || '',
          name: 'Owner',
          role: 'owner',
          joinedAt: new Date().toISOString(),
        });
      }
    } catch {
      // ignore localStorage errors
    }
  }

  const list = Array.from(membershipsMap.values());
  if (list.length > 0) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        memberships: list,
        defaultBusinessId: list[0].businessId,
        onboardingCompleted: true,
      });
    } catch {
      // ignore update errors
    }
  }

  return list;
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
    try {
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
    } catch (e) {
      console.warn('Seeding default services non-blocking warning:', e);
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

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cineinvoice_active_biz_' + owner.uid, businessId);
        localStorage.removeItem('cineinvoice_wizard_draft_' + owner.uid);
      } catch {
        // ignore storage errors
      }
    }

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

// INVOICES PERSISTENCE & RETRIEVAL
export async function getInvoices(businessId: string): Promise<Invoice[]> {
  const path = `businesses/${businessId}/invoices`;
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const invoices = snap.docs.map((d) => d.data() as Invoice);
    // Cache to localStorage for fast access & offline backup
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cineinvoice_invoices_${businessId}`, JSON.stringify(invoices));
      } catch {
        // ignore quota
      }
    }
    return invoices;
  } catch (error) {
    console.warn('Error fetching invoices from Firestore, checking local backup:', error);
    // Fallback to local storage cache so user never loses their invoice history
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`cineinvoice_invoices_${businessId}`);
        if (cached) {
          return JSON.parse(cached) as Invoice[];
        }
      } catch {
        // ignore
      }
    }
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// GET ALL INVOICES CREATED BY USER (ACROSS ALL WORKSPACES)
export async function getAllUserInvoices(userId: string): Promise<Invoice[]> {
  const invoiceMap = new Map<string, Invoice>();

  // 1. Try Collection Group query for all invoices created by this user
  try {
    const q = query(collectionGroup(db, 'invoices'), where('createdBy', '==', userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const inv = d.data() as Invoice;
      if (inv && inv.id) invoiceMap.set(inv.id, inv);
    }
  } catch (err) {
    console.warn('CollectionGroup invoices query notice:', err);
  }

  // 2. Query invoices across all businesses owned by this user
  try {
    const ownedBizs = await getBusinessesByOwner(userId);
    for (const biz of ownedBizs) {
      const bizInvs = await getInvoices(biz.id);
      for (const inv of bizInvs) {
        if (inv && inv.id) invoiceMap.set(inv.id, inv);
      }
    }
  } catch (err) {
    console.warn('Owned businesses invoices notice:', err);
  }

  // 3. Merge with local storage global user cache
  if (typeof window !== 'undefined') {
    try {
      const userCached = localStorage.getItem(`cineinvoice_user_all_invoices_${userId}`);
      if (userCached) {
        const list = JSON.parse(userCached) as Invoice[];
        for (const inv of list) {
          if (inv && inv.id && !invoiceMap.has(inv.id)) {
            invoiceMap.set(inv.id, inv);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  const all = Array.from(invoiceMap.values());
  // Sort descending by date
  all.sort((a, b) => new Date(b.createdAt || b.issueDate).getTime() - new Date(a.createdAt || a.issueDate).getTime());

  // Update user all invoices cache
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`cineinvoice_user_all_invoices_${userId}`, JSON.stringify(all));
    } catch {
      // ignore
    }
  }

  return all;
}

export async function getInvoice(businessId: string, invoiceId: string): Promise<Invoice | null> {
  const path = `businesses/${businessId}/invoices/${invoiceId}`;
  try {
    const snap = await getDoc(doc(db, path));
    if (snap.exists()) {
      return snap.data() as Invoice;
    }
    // Check local cache
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`cineinvoice_invoices_${businessId}`);
      if (cached) {
        const list = JSON.parse(cached) as Invoice[];
        const found = list.find((i) => i.id === invoiceId);
        if (found) return found;
      }
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
    try {
      await updateDoc(doc(db, `businesses/${businessId}`), {
        nextInvoiceNumber: (business.nextInvoiceNumber || 1) + 1,
      });
    } catch (e) {
      console.warn('Next invoice number update notice:', e);
    }

    // Save to local storage caches for fast UI response and data preservation
    if (typeof window !== 'undefined') {
      try {
        const bizKey = `cineinvoice_invoices_${businessId}`;
        const existing = JSON.parse(localStorage.getItem(bizKey) || '[]');
        const updated = [invoice, ...existing.filter((i: Invoice) => i.id !== invId)];
        localStorage.setItem(bizKey, JSON.stringify(updated));

        if (invoice.createdBy) {
          const userKey = `cineinvoice_user_all_invoices_${invoice.createdBy}`;
          const userInvs = JSON.parse(localStorage.getItem(userKey) || '[]');
          localStorage.setItem(userKey, JSON.stringify([invoice, ...userInvs.filter((i: Invoice) => i.id !== invId)]));
        }
      } catch {
        // ignore
      }
    }

    return invoice;
  } catch (error) {
    // If write fails, still backup locally so user does not lose invoice
    if (typeof window !== 'undefined') {
      try {
        const bizKey = `cineinvoice_invoices_${businessId}`;
        const existing = JSON.parse(localStorage.getItem(bizKey) || '[]');
        localStorage.setItem(bizKey, JSON.stringify([invoice, ...existing]));
      } catch {
        // ignore
      }
    }
    handleFirestoreError(error, OperationType.CREATE, path);
    return invoice;
  }
}

export async function updateInvoice(businessId: string, invoiceId: string, updates: Partial<Invoice>): Promise<void> {
  const path = `businesses/${businessId}/invoices/${invoiceId}`;
  try {
    await updateDoc(doc(db, path), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    // Update local cache
    if (typeof window !== 'undefined') {
      try {
        const bizKey = `cineinvoice_invoices_${businessId}`;
        const existing = JSON.parse(localStorage.getItem(bizKey) || '[]');
        const updated = existing.map((i: Invoice) =>
          i.id === invoiceId ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
        );
        localStorage.setItem(bizKey, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteInvoice(businessId: string, invoiceId: string): Promise<void> {
  const path = `businesses/${businessId}/invoices/${invoiceId}`;
  try {
    await deleteDoc(doc(db, path));
    // Remove from local cache
    if (typeof window !== 'undefined') {
      try {
        const bizKey = `cineinvoice_invoices_${businessId}`;
        const existing = JSON.parse(localStorage.getItem(bizKey) || '[]');
        localStorage.setItem(bizKey, JSON.stringify(existing.filter((i: Invoice) => i.id !== invoiceId)));
      } catch {
        // ignore
      }
    }
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

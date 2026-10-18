export type WorkspaceType = 'freelancer' | 'umkm';
export type MemberRole = 'owner' | 'admin' | 'finance' | 'staff';
export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceTemplate = 'corporate' | 'minimalist' | 'creative';
export type DiscountType = 'fixed' | 'percent';

export interface Business {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  ownerEmail: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  npwp?: string;
  logoUrl?: string;
  currency: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  defaultPaymentTermsDays: number;
  defaultTemplate: InvoiceTemplate;
  ppnEnabled: boolean;
  ppnRate: number; // e.g. 11 or 12
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  defaultNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  userId: string;
  businessId: string;
  email: string;
  name: string;
  role: MemberRole;
  invitedBy?: string;
  joinedAt: string;
}

export interface Client {
  id: string;
  businessId: string;
  name: string;
  company?: string;
  email?: string;
  phone: string;
  address?: string;
  npwp?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceItem {
  id: string;
  businessId: string;
  name: string;
  category: string;
  description?: string;
  unit: string;
  defaultPrice: number;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  serviceId?: string;
  quantity: number;
  unit: string;
  price: number;
  discountPercent?: number;
  amount: number;
}

export interface Invoice {
  id: string;
  businessId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientCompany?: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress?: string;
  clientNpwp?: string;
  projectTitle: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  template: InvoiceTemplate;
  items: InvoiceItem[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountTotal: number;
  ppnEnabled: boolean;
  ppnRate: number;
  ppnAmount: number;
  grandTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  downPayment: number;
  notes: string;
  bankDetails: string;
  shareToken?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  businessId: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  date: string;
  method: string; // Transfer BCA, Mandiri, BRI, QRIS, Cash
  reference?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface Invitation {
  id: string;
  businessId: string;
  businessName: string;
  email: string;
  role: MemberRole;
  invitedBy: string;
  invitedByEmail: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface SharedInvoice {
  token: string;
  businessId: string;
  invoiceId: string;
  invoiceData: string; // JSON stringified invoice + business details
  active: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  defaultBusinessId?: string;
  isPlatformAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  action: string;
  actorId: string;
  actorEmail: string;
  details: string;
  timestamp: string;
}

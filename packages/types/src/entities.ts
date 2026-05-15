import type {
  UserRole,
  TenantType,
  TransactionStatus,
  ReviewStatus,
  ExtractionStatus,
  FileType,
  BusinessType,
  AuditAction,
} from './domain';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  type: TenantType;
  name: string;
  parentTenantId: string | null;
  createdAt: Date;
}

export interface AccountingFirm {
  id: string;
  tenantId: string;
  name: string;
  gstNumber: string | null;
  contactEmail: string;
  contactPhone: string | null;
  createdAt: Date;
}

export interface Company {
  id: string;
  tenantId: string;
  accountingFirmId: string;
  name: string;
  gstNumber: string | null;
  businessType: BusinessType;
  contactEmail: string;
  createdAt: Date;
}

export interface Upload {
  id: string;
  tenantId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileType: FileType;
  uploadedBy: string;
  createdAt: Date;
}

export interface ExtractionJob {
  id: string;
  tenantId: string;
  uploadId: string;
  status: ExtractionStatus;
  promptVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtractionResult {
  id: string;
  extractionJobId: string;
  rawResponse: string;
  parsedResponse: Record<string, unknown>;
  confidenceScore: number;
  validationErrors: string[];
  createdAt: Date;
}

export interface Invoice {
  id: string;
  tenantId: string;
  uploadId: string;
  vendorName: string | null;
  invoiceNumber: string | null;
  invoiceDate: Date | null;
  amount: number | null;
  currency: string | null;
  status: TransactionStatus;
  createdAt: Date;
}

export interface Review {
  id: string;
  tenantId: string;
  extractionResultId: string;
  reviewedBy: string | null;
  status: ReviewStatus;
  rejectionReason: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface Transaction {
  id: string;
  tenantId: string;
  invoiceId: string;
  vendorName: string;
  amount: number;
  currency: string;
  transactionDate: Date;
  paymentHeadId: string;
  paymentSubHeadId: string;
  status: TransactionStatus;
  notes: string | null;
  createdAt: Date;
}

export interface PaymentHead {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

export interface PaymentSubHead {
  id: string;
  tenantId: string;
  paymentHeadId: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
}

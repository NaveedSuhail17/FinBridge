import type {
  UserRole,
  TenantType,
  TransactionStatus,
  ReviewStatus,
  ExtractionStatus,
  FileType,
  BusinessType,
  AuditAction,
  NotificationType,
} from './domain';

export interface PlatformUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  type: TenantType;
  name: string;
  parentTenantId: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface Role {
  id: string;
  name: UserRole;
  description: string | null;
  createdAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  action: string;
  resource: string;
  createdAt: Date;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
}

export interface UserTenant {
  id: string;
  userId: string;
  tenantId: string;
  roleId: string;
  createdAt: Date;
}

export interface AccountingFirm {
  id: string;
  tenantId: string;
  name: string;
  gstNumber: string | null;
  contactEmail: string;
  contactPhone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  tenantId: string;
  accountingFirmId: string;
  name: string;
  gstNumber: string | null;
  businessType: BusinessType;
  contactEmail: string;
  contactPhone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  extractionJob?: {
    id: string;
    status: ExtractionStatus;
    documentType: FileType | null;
    extractionResult?: {
      id: string;
      review?: {
        id: string;
        status: ReviewStatus;
      };
    };
  };
}

export interface ExtractionJob {
  id: string;
  tenantId: string;
  uploadId: string;
  status: ExtractionStatus;
  promptVersion: string;
  errorMessage: string | null;
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

export interface ExtractionRevision {
  id: string;
  extractionResultId: string;
  revisionNumber: number;
  correctedData: Record<string, unknown>;
  correctedBy: string;
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
  subtotal: number | null;
  taxAmount: number | null;
  currency: string | null;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  tenantId: string;
  extractionResultId: string;
  reviewedBy: string | null;
  status: ReviewStatus;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: Date;
  completedAt: Date | null;
  escalatedAt: Date | null;
}

export interface ReviewHistory {
  id: string;
  reviewId: string;
  fieldName: string;
  originalValue: string | null;
  newValue: string | null;
  changedBy: string;
  createdAt: Date;
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
  updatedAt: Date;
}

export interface PaymentHead {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentSubHead {
  id: string;
  tenantId: string;
  paymentHeadId: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessTypeTemplate {
  id: string;
  businessType: BusinessType;
  defaultTree: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MISReport {
  id: string;
  tenantId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
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

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: Date;
}

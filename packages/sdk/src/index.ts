// Core
export { apiClient } from './api-client';
export { useAuthStore } from './store/auth.store';
export type {
  AuthUser,
  AuthTokens,
  ApiEnvelope,
  PaginatedEnvelope,
  PaginatedMeta,
  UploadProgressEvent,
} from './types';

// Services
export { authService } from './services/auth.service';
export type { LoginDto, RegisterDto, AcceptInviteDto } from './services/auth.service';

export { usersService } from './services/users.service';
export type { UserProfile, UpdateUserDto } from './services/users.service';

export { companiesService } from './services/companies.service';
export type {
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyDetails,
} from './services/companies.service';

export { uploadsService } from './services/uploads.service';
export type { UploadResult } from './services/uploads.service';

export { reviewsService } from './services/reviews.service';
export type {
  ReviewDetail,
  ApproveReviewDto,
  RejectReviewDto,
  EditReviewDto,
  PendingReviewsResponse,
} from './services/reviews.service';

export { transactionsService } from './services/transactions.service';
export type {
  TransactionFilters,
  UpdateTransactionDto,
  TransactionListResponse,
} from './services/transactions.service';

export { paymentHeadsService } from './services/payment-heads.service';
export type {
  PaymentHeadWithSubHeads,
  CreatePaymentHeadDto,
  UpdatePaymentHeadDto,
} from './services/payment-heads.service';

export { reportsService } from './services/reports.service';
export type {
  ReportType,
  GenerateReportDto,
  ShareReportDto,
  ShareLink,
} from './services/reports.service';

export { auditService } from './services/audit.service';
export type { AuditLogFilters, AuditLogListResponse } from './services/audit.service';

export { extractionService } from './services/extraction.service';
export type { ExtractionJobStatus } from './services/extraction.service';

export { notificationsService } from './services/notifications.service';
export type { NotificationItem, NotificationListResponse } from './services/notifications.service';

export { bankStatementsService } from './services/bank-statements.service';
export type { BankStatementRecord, BankTransactionRow } from './services/bank-statements.service';

export { insightsService } from './services/insights.service';
export type {
  CashFlowMonth,
  CashFlowResponse,
  ExpenseHeadEntry,
  TopExpenseHeadsResponse,
  UploadFunnelResponse,
  VendorEntry,
  VendorSummaryResponse,
} from './services/insights.service';

// Hooks
export { useAuth } from './hooks/useAuth';
export { useTenant } from './hooks/useTenant';
export { useUpload } from './hooks/useUpload';
export type { UploadStatus, UploadState } from './hooks/useUpload';
export { useExtraction } from './hooks/useExtraction';
export { useReview } from './hooks/useReview';
export { useTransactionList } from './hooks/useTransaction';
export { useNotifications } from './hooks/useNotifications';
export type { UseNotificationsResult } from './hooks/useNotifications';

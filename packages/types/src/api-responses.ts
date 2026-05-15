export interface ApiResponse<T = unknown> {
  success: boolean;
  requestId: string;
  message: string;
  data: T;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  requestId: string;
  message: string;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  requestId: string;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

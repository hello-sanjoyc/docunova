export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface ApiResponse<T = unknown> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

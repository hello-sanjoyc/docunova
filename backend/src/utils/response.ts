import { ApiResponse } from '../types';

export function successResponse<T>(
  message: string,
  data?: T,
  statusCode = 200
): ApiResponse<T> {
  return { statusCode, success: true, message, data };
}

export function errorResponse(
  message: string,
  error?: string,
  statusCode = 500
): ApiResponse {
  return { statusCode, success: false, message, error };
}

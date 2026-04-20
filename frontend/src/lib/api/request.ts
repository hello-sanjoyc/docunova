import { AxiosRequestConfig } from "axios";
import { apiClient } from "./client";
import { ApiErrorCode, toApiError } from "./errors";

interface ApiSuccessResponse<TData> {
    statusCode?: number;
    success: boolean;
    message: string;
    data?: TData;
    error?: string;
}

export async function apiRequest<TData>(
    config: AxiosRequestConfig,
): Promise<TData> {
    try {
        const response = await apiClient.request<
            ApiSuccessResponse<TData> | TData
        >(config);
        const payload = response.data;

        if (payload && typeof payload === "object" && "success" in payload) {
            const apiPayload = payload as ApiSuccessResponse<TData>;
            if (!apiPayload.success) {
                throw {
                    code: ApiErrorCode.UNKNOWN,
                    status: apiPayload.statusCode ?? response.status ?? null,
                    message:
                        apiPayload.error ||
                        apiPayload.message ||
                        "API request failed.",
                };
            }
            return apiPayload.data as TData;
        }

        return payload as TData;
    } catch (error) {
        throw toApiError(error);
    }
}

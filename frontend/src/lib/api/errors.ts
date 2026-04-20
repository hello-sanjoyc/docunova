import axios, { AxiosError } from "axios";

export enum ApiErrorCode {
    BAD_REQUEST = "BAD_REQUEST",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    UNPROCESSABLE_ENTITY = "UNPROCESSABLE_ENTITY",
    TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
    SERVER_ERROR = "SERVER_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    TIMEOUT = "TIMEOUT",
    CANCELLED = "CANCELLED",
    UNKNOWN = "UNKNOWN",
}

export interface ApiErrorShape {
    code: ApiErrorCode;
    status: number | null;
    message: string;
    details?: unknown;
}

interface ErrorResponseBody {
    statusCode?: number;
    success?: boolean;
    message?: string;
    error?: string;
    code?: string;
    details?: unknown;
}

function isApiErrorShape(error: unknown): error is ApiErrorShape {
    if (!error || typeof error !== "object") return false;

    const maybe = error as Partial<ApiErrorShape> & { isAxiosError?: boolean };
    if (maybe.isAxiosError) return false;

    const validCodes = Object.values(ApiErrorCode);
    return (
        typeof maybe.code === "string" &&
        validCodes.includes(maybe.code as ApiErrorCode) &&
        typeof maybe.message === "string" &&
        (typeof maybe.status === "number" ||
            maybe.status === null ||
            typeof maybe.status === "undefined")
    );
}

function codeFromStatus(status?: number): ApiErrorCode {
    switch (status) {
        case 400:
            return ApiErrorCode.BAD_REQUEST;
        case 401:
            return ApiErrorCode.UNAUTHORIZED;
        case 403:
            return ApiErrorCode.FORBIDDEN;
        case 404:
            return ApiErrorCode.NOT_FOUND;
        case 409:
            return ApiErrorCode.CONFLICT;
        case 422:
            return ApiErrorCode.UNPROCESSABLE_ENTITY;
        case 429:
            return ApiErrorCode.TOO_MANY_REQUESTS;
        default:
            if (status && status >= 500) {
                return ApiErrorCode.SERVER_ERROR;
            }
            return ApiErrorCode.UNKNOWN;
    }
}

function messageFromStatus(status?: number): string {
    switch (status) {
        case 400:
            return "Invalid request.";
        case 401:
            return "Authentication required.";
        case 403:
            return "You are not allowed to perform this action.";
        case 404:
            return "Requested resource was not found.";
        case 409:
            return "Conflict detected while processing your request.";
        case 422:
            return "Request validation failed.";
        case 429:
            return "Too many requests. Please try again later.";
        default:
            if (status && status >= 500) {
                return "Server error. Please try again in a moment.";
            }
            return "Something went wrong. Please try again.";
    }
}

export function toApiError(error: unknown): ApiErrorShape {
    if (isApiErrorShape(error)) {
        return {
            code: error.code,
            status: error.status ?? null,
            message: error.message,
            details: error.details,
        };
    }

    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorResponseBody>;

        if (axiosError.code === "ERR_CANCELED") {
            return {
                code: ApiErrorCode.CANCELLED,
                status: null,
                message: "Request cancelled.",
            };
        }

        if (axiosError.code === "ECONNABORTED") {
            return {
                code: ApiErrorCode.TIMEOUT,
                status: null,
                message: "Request timed out. Please try again.",
            };
        }

        if (!axiosError.response) {
            return {
                code: ApiErrorCode.NETWORK_ERROR,
                status: null,
                message:
                    "Unable to reach server. Check your internet or API URL.",
            };
        }

        const status =
            axiosError.response.data?.statusCode ?? axiosError.response.status;
        const body = axiosError.response.data;

        return {
            code: codeFromStatus(status),
            status,
            message: body?.message || body?.error || messageFromStatus(status),
            details: body?.details,
        };
    }

    if (error instanceof Error) {
        return {
            code: ApiErrorCode.UNKNOWN,
            status: null,
            message: error.message,
        };
    }

    return {
        code: ApiErrorCode.UNKNOWN,
        status: null,
        message: "Unexpected error occurred.",
    };
}

export function formatApiError(error: unknown): string {
    return toApiError(error).message;
}

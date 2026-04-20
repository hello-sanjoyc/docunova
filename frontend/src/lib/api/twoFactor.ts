import { apiRequest } from './request';
import { API_ENDPOINTS } from './endpoints';

export interface TwoFactorSetupResult {
    otpauthUri:     string;
    qrCodeDataUrl:  string;
    secret:         string;
}

/** Step 1 — Initiate setup. Returns QR code and raw secret. */
export function enable2FA() {
    return apiRequest<TwoFactorSetupResult>({
        method: 'POST',
        url:    API_ENDPOINTS.AUTH.TWO_FACTOR_ENABLE,
    });
}

/** Step 2 — Confirm with first TOTP code. Activates 2FA. */
export function verify2FA(code: string) {
    return apiRequest<void>({
        method: 'POST',
        url:    API_ENDPOINTS.AUTH.TWO_FACTOR_VERIFY,
        data:   { code },
    });
}

/** Disable 2FA. */
export function disable2FA() {
    return apiRequest<void>({
        method: 'DELETE',
        url:    API_ENDPOINTS.AUTH.TWO_FACTOR_DISABLE,
    });
}

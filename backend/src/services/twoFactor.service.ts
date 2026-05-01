import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import prisma from '../config/prisma';
import { invalidateUserCaches } from './user.service';

const APP_NAME = 'Docunova';

/**
 * Step 1 — generate and persist a fresh TOTP secret.
 * 2FA remains disabled until verify2FA succeeds.
 */
export async function initiate2FA(userUuid: string): Promise<{
    otpauthUri: string;
    qrCodeDataUrl: string;
    secret: string;
}> {
    const user = await prisma.user.findUnique({
        where: { uuid: userUuid, deletedAt: null },
        select: { id: true, email: true, twoFactorEnabled: true },
    });

    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    if (user.twoFactorEnabled) throw Object.assign(new Error('2FA is already enabled'), { statusCode: 409 });

    const generated = speakeasy.generateSecret({ name: `${APP_NAME} (${user.email})`, length: 20 });

    const secret       = generated.base32;
    const otpauthUri   = generated.otpauth_url as string;
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUri);

    // Persist secret only. Enabling happens after first valid TOTP verification.
    await prisma.user.update({
        where: { id: user.id },
        data:  {
            twoFactorSecret: secret,
            twoFactorEnabled: false,
        },
    });

    await invalidateUserCaches(userUuid);
    return { otpauthUri, qrCodeDataUrl, secret };
}

/**
 * Step 2 — Confirm the first TOTP code from the authenticator app.
 * On success, marks twoFactorEnabled = true.
 */
export async function verify2FA(userUuid: string, code: string): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { uuid: userUuid, deletedAt: null },
        select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    if (user.twoFactorEnabled) throw Object.assign(new Error('2FA is already enabled'), { statusCode: 409 });
    if (!user.twoFactorSecret) {
        throw Object.assign(new Error('2FA setup not initiated — call /auth/2fa/enable first'), { statusCode: 400 });
    }

    const isValid = speakeasy.totp.verify({
        secret:   user.twoFactorSecret,
        encoding: 'base32',
        token:    code,
        window:   1, // allow ±30s clock drift
    });

    if (!isValid) throw Object.assign(new Error('Invalid or expired code'), { statusCode: 400 });

    await prisma.user.update({
        where: { id: user.id },
        data:  { twoFactorEnabled: true },
    });

    await invalidateUserCaches(userUuid);
}

/**
 * Disable 2FA.
 */
export async function disable2FA(userUuid: string): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { uuid: userUuid, deletedAt: null },
        select: { id: true, twoFactorEnabled: true },
    });

    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    if (!user.twoFactorEnabled) throw Object.assign(new Error('2FA is not enabled'), { statusCode: 400 });

    await prisma.user.update({
        where: { id: user.id },
        data:  { twoFactorEnabled: false, twoFactorSecret: null },
    });

    await invalidateUserCaches(userUuid);
}

"use client";

import { useCallback, useEffect } from "react";

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill?: { name?: string; email?: string };
    theme?: { color?: string };
    handler: (response: RazorpaySuccessResponse) => void;
    modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
    open(): void;
    close(): void;
}

export interface RazorpaySuccessResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export function useRazorpay() {
    useEffect(() => {
        if (document.getElementById("razorpay-script")) return;
        const script = document.createElement("script");
        script.id = "razorpay-script";
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.head.appendChild(script);
    }, []);

    const openCheckout = useCallback(
        (
            options: Omit<RazorpayOptions, "handler"> & {
                onSuccess: (response: RazorpaySuccessResponse) => void;
                onDismiss?: () => void;
            },
        ) => {
            return new Promise<RazorpaySuccessResponse>((resolve, reject) => {
                if (!window.Razorpay) {
                    reject(new Error("Razorpay SDK not loaded"));
                    return;
                }
                const rzp = new window.Razorpay({
                    ...options,
                    handler: (response) => {
                        options.onSuccess(response);
                        resolve(response);
                    },
                    modal: {
                        ondismiss: () => {
                            options.onDismiss?.();
                            reject(new Error("Payment dismissed"));
                        },
                    },
                });
                rzp.open();
            });
        },
        [],
    );

    return { openCheckout };
}

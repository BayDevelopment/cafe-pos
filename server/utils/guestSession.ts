import type { H3Event } from "h3";
import { getCookie, setCookie } from "h3";
import crypto from "node:crypto";

const COOKIE_NAME = "guest_session";
const COOKIE_MAX_AGE = 60 * 60 * 6; // 6 jam

export function getOrCreateGuestSessionId(event: H3Event): string {
    let sessionId = getCookie(event, COOKIE_NAME);

    if (!sessionId) {
        sessionId = crypto.randomUUID();
        setCookie(event, COOKIE_NAME, sessionId, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: COOKIE_MAX_AGE,
        });
    }

    return sessionId;
}
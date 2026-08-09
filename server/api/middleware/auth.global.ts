// server/middleware/auth.global.ts
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  role: "PEMILIK" | "KASIR";
  iat: number;
  exp: number;
}

export default defineEventHandler((event) => {
  // 1. Cek token dari cookie
  let token = getCookie(event, "auth_token");

  // 2. Jika tidak ada di cookie, cek dari Header Authorization (Bearer)
  if (!token) {
    const authHeader = getHeader(event, "authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  // Jika tidak ada token sama sekali, biarkan event.context.user kosong
  if (!token) {
    return;
  }

  try {
    // 3. Pastikan JWT_SECRET ini persis sama dengan yang ada di server/api/auth/login.post.ts
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-kedaikopi";
    const payload = jwt.verify(token, jwtSecret) as JwtPayload;

    // Set user ke event context jika token valid
    event.context.user = {
      id: payload.userId,
      role: payload.role,
    };
  } catch (error) {
    // Token kedaluwarsa / invalid
    deleteCookie(event, "auth_token", { path: "/" });
    event.context.user = undefined;
  }
});
// server/middleware/auth.ts
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  role: "PEMILIK" | "KASIR";
  iat: number;
  exp: number;
}

export default defineEventHandler((event) => {
  const token = getCookie(event, "auth_token");

  // Tidak ada token → biarkan event.context.user tetap undefined.
  // JANGAN throw di sini — middleware ini jalan di SEMUA request,
  // termasuk /api/auth/login yang justru harus bisa diakses tanpa login.
  // Endpoint yang butuh login (me.ts, change-password.ts, dll) yang
  // bertanggung jawab menolak request kalau event.context.user kosong.
  if (!token) {
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    event.context.user = {
      id: payload.userId,
      role: payload.role,
    };
  } catch (error) {
    // Token invalid/expired/dipalsukan → jangan crash, cukup anggap
    // user tidak login. Cookie yang rusak/expired dibersihkan di sini juga.
    deleteCookie(event, "auth_token", { path: "/" });
    event.context.user = undefined;
  }
});
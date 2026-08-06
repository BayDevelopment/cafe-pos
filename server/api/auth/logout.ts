// server/api/auth/logout.ts
export default defineEventHandler((event) => {
  if (event.method !== "POST") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  deleteCookie(event, "auth_token", {
    path: "/",
  });

  return {
    success: true,
    message: "Logout berhasil",
  };
});
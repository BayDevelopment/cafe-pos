import { defineEventHandler, setResponseHeaders } from "h3";
import { db } from "../../utils/db";
import { requireUser } from "../../utils/auth";

const CHECK_INTERVAL_MS = 3000; // cek perubahan tiap 3 detik

export default defineEventHandler(async (event) => {
    const authUser = await requireUser(event);

    setResponseHeaders(event, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // penting kalau di belakang nginx, cegah buffering
    });

    const res = event.node.res;
    const req = event.node.req;

    // Snapshot awal untuk pembanding
    let lastIsActive: boolean | null = null;
    let lastEmailVerified: boolean | null = null;

    const send = (eventName: string, data: unknown) => {
        res.write(`event: ${eventName}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const checkAndPush = async () => {
        const current = await db.user.findUnique({
            where: { id: authUser.id },
            select: { isActive: true, emailVerifiedAt: true, name: true, email: true, role: true },
        });

        if (!current) {
            // User terhapus dari database
            send("force-logout", { reason: "Akun tidak ditemukan." });
            clearInterval(intervalId);
            res.end();
            return;
        }

        const isVerified = !!current.emailVerifiedAt;

        // Kondisi pertama kali jalan, simpan baseline saja
        if (lastIsActive === null) {
            lastIsActive = current.isActive;
            lastEmailVerified = isVerified;
            return;
        }

        // Akun dinonaktifkan -> paksa logout
        if (lastIsActive === true && current.isActive === false) {
            send("force-logout", { reason: "Akun Anda telah dinonaktifkan oleh Pemilik." });
            clearInterval(intervalId);
            res.end();
            return;
        }

        // Status verifikasi email berubah -> beri tahu client untuk sync UI
        if (lastEmailVerified !== isVerified) {
            send("profile-updated", {
                emailVerifiedAt: current.emailVerifiedAt,
                isActive: current.isActive,
            });
        }

        lastIsActive = current.isActive;
        lastEmailVerified = isVerified;
    };

    // Jalankan sekali di awal untuk set baseline
    await checkAndPush();

    const intervalId = setInterval(checkAndPush, CHECK_INTERVAL_MS);

    // Heartbeat supaya koneksi tidak ditutup proxy/browser karena idle
    const heartbeatId = setInterval(() => {
        res.write(`: heartbeat\n\n`);
    }, 20000);

    req.on("close", () => {
        clearInterval(intervalId);
        clearInterval(heartbeatId);
    });

    // Biarkan handler ini "menggantung" (streaming), jangan return apa pun
    event._handled = true;
});
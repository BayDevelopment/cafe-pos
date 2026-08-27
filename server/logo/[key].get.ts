// server/routes/logo/[key].get.ts
import { defineEventHandler, getRouterParam, setResponseHeader, createError, send } from "h3";
import { getStore } from "@netlify/blobs";

const LOGO_STORE_NAME = "shop-logos";

export default defineEventHandler(async (event) => {
    const key = getRouterParam(event, "key");
    if (!key) {
        throw createError({ statusCode: 400, message: "Nama file tidak valid." });
    }

    // Inisialisasi Netlify Blobs dengan kredensial Environment Variables
    const logoStore = getStore({
        name: LOGO_STORE_NAME,
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN,
        consistency: "strong",
    });

    const result = await logoStore.getWithMetadata(key, { type: "arrayBuffer" });
    if (!result || !result.data) {
        throw createError({ statusCode: 404, message: "Logo tidak ditemukan." });
    }

    const contentType = (result.metadata?.contentType as string) || "application/octet-stream";
    setResponseHeader(event, "Content-Type", contentType);
    // Cache 1 tahun karena nama file berwujud unik (mengandung timestamp + random hex)
    setResponseHeader(event, "Cache-Control", "public, max-age=31536000, immutable");

    return send(event, Buffer.from(result.data as ArrayBuffer));
});
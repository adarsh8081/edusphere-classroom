/**
 * fileUploadService.ts — Cloud-agnostic file upload service.
 *
 * Provides two integration paths:
 *  1. multerUpload — Express middleware using multer-s3 (streams directly to S3)
 *     or multer memory storage (saves to ./uploads/ locally).
 *  2. uploadBuffer  — Raw buffer upload helper (for programmatic use).
 *
 * Usage in routes.ts:
 *   import { multerUpload, getUploadedFileUrl } from "./fileUploadService";
 *   app.post("/api/upload", multerUpload.single("file"), (req, res) => {
 *     res.json({ url: getUploadedFileUrl(req.file) });
 *   });
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import multerS3 from "multer-s3";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// ──────────────────────────────────────────────────────────────────────────────
// S3 client (initialised only when credentials are present)
// ──────────────────────────────────────────────────────────────────────────────
const hasS3 = !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
);

export const s3Client = hasS3
    ? new S3Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    })
    : null;

if (hasS3) {
    console.log("[FileUpload] S3 storage active — bucket:", process.env.AWS_S3_BUCKET);
} else {
    console.log("[FileUpload] S3 not configured — using local ./uploads/ fallback.");
}

// ──────────────────────────────────────────────────────────────────────────────
// Local upload directory (used when S3 is not configured)
// ──────────────────────────────────────────────────────────────────────────────
const LOCAL_UPLOAD_DIR = path.resolve("uploads");
if (!hasS3) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

// ──────────────────────────────────────────────────────────────────────────────
// Key / filename generator
// ──────────────────────────────────────────────────────────────────────────────
const S3_FOLDER = "edusphere-uploads";

function generateKey(originalName: string): string {
    const ext = path.extname(originalName) || "";
    return `${S3_FOLDER}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// multerUpload middleware — use this in Express routes directly
// ──────────────────────────────────────────────────────────────────────────────
export const multerUpload = hasS3 && s3Client
    ? multer({
        storage: multerS3({
            s3: s3Client,
            bucket: process.env.AWS_S3_BUCKET!,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            key(_req, file, cb) {
                cb(null, generateKey(file.originalname));
            },
        }),
        limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    })
    : multer({
        storage: multer.diskStorage({
            destination: LOCAL_UPLOAD_DIR,
            filename(_req, file, cb) {
                cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${path.extname(file.originalname)}`);
            },
        }),
        limits: { fileSize: 50 * 1024 * 1024 },
    });

/**
 * Extract the public URL from a multer file object after upload.
 * Works for both S3 (via multer-s3's `location` field) and local disk storage.
 */
export function getUploadedFileUrl(file: Express.MulterS3.File | Express.Multer.File): string {
    // multer-s3 sets `location` to the S3 public URL
    if ("location" in file && (file as any).location) {
        return (file as any).location as string;
    }
    // Local disk storage — return a server-relative path
    return `/uploads/${(file as Express.Multer.File).filename}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Buffer upload — for programmatic use (no HTTP request context needed)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Upload a raw Buffer to S3 or the local filesystem.
 * Returns the public URL of the stored file.
 */
export async function uploadBuffer(
    buffer: Buffer,
    originalName: string,
    mimeType: string
): Promise<string> {
    if (s3Client && hasS3) {
        const key = generateKey(originalName);
        await s3Client.send(
            new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET!,
                Key: key,
                Body: buffer,
                ContentType: mimeType,
                // Remove ACL line if bucket has Object Ownership = BucketOwnerEnforced
                // ACL: "public-read",
            })
        );
        const region = process.env.AWS_REGION || "us-east-1";
        return `https://${process.env.AWS_S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;
    }
    // Local fallback
    const filename = generateKey(originalName).replace(`${S3_FOLDER}/`, "");
    const filePath = path.join(LOCAL_UPLOAD_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Presigned URL helper (S3 only) — lets the browser upload directly to S3
// without passing the file through your server.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Generate a short-lived presigned S3 PUT URL.
 * The browser can PUT a file directly to this URL (no server proxying).
 *
 * @param originalName  Original filename (used to determine extension)
 * @param mimeType      Content-Type the browser will send
 * @param expiresIn     Seconds until the URL expires (default: 5 minutes)
 * @returns             `{ uploadUrl, fileUrl }` — uploadUrl for PUT, fileUrl for storage
 */
export async function getPresignedUploadUrl(
    originalName: string,
    mimeType: string,
    expiresIn = 300
): Promise<{ uploadUrl: string; fileUrl: string } | null> {
    if (!s3Client || !hasS3) return null;

    const key = generateKey(originalName);
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    const region = process.env.AWS_REGION || "us-east-1";
    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl };
}

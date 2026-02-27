/**
 * fileStorage.ts — Cloud-agnostic file upload helper.
 *
 * Behaviour:
 *  • If AWS_ACCESS_KEY_ID + AWS_S3_BUCKET are set → uploads to S3 and returns a public URL.
 *  • Otherwise → saves the file under ./uploads/ and returns a local server path.
 *
 * Usage:
 *   import { uploadFile } from "./fileStorage";
 *   const url = await uploadFile(buffer, "homework.pdf", "application/pdf");
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// ──────────────────────────────────────────────────────────────────────────────
// S3 setup (only when env vars are present)
// ──────────────────────────────────────────────────────────────────────────────
const hasS3 = !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
);

let s3Client: S3Client | null = null;
if (hasS3) {
    s3Client = new S3Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    });
    console.log("[FileStorage] S3 storage enabled — bucket:", process.env.AWS_S3_BUCKET);
} else {
    console.log("[FileStorage] S3 not configured — using local ./uploads/ fallback.");
}

// ──────────────────────────────────────────────────────────────────────────────
// Ensure local uploads directory exists (fallback path)
// ──────────────────────────────────────────────────────────────────────────────
const LOCAL_UPLOAD_DIR = path.resolve("uploads");
if (!hasS3) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

// ──────────────────────────────────────────────────────────────────────────────
// Main exported helper
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Upload a file buffer and return its public-accessible URL.
 *
 * @param buffer       Raw file bytes
 * @param originalName Original filename from the upload (e.g. "notes.pdf")
 * @param mimeType     MIME type (e.g. "application/pdf", "image/png")
 * @returns            Public URL string
 */
export async function uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string
): Promise<string> {
    // Generate a unique filename to avoid collisions
    const ext = path.extname(originalName) || "";
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

    if (s3Client && hasS3) {
        return uploadToS3(s3Client, buffer, uniqueName, mimeType);
    }
    return saveLocally(buffer, uniqueName);
}

// ──────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────────────────────────────────────

async function uploadToS3(
    client: S3Client,
    buffer: Buffer,
    key: string,
    mimeType: string
): Promise<string> {
    const bucket = process.env.AWS_S3_BUCKET!;
    const folder = "edusphere-uploads";

    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: `${folder}/${key}`,
            Body: buffer,
            ContentType: mimeType,
            // Remove ACL for buckets with Object Ownership = BucketOwnerEnforced
            // ACL: "public-read",
        })
    );

    const region = process.env.AWS_REGION || "us-east-1";
    return `https://${bucket}.s3.${region}.amazonaws.com/${folder}/${key}`;
}

function saveLocally(buffer: Buffer, filename: string): string {
    const filePath = path.join(LOCAL_UPLOAD_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
}

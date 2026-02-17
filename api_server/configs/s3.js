import { S3Client, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

// RustFS/S3-compatible storage configuration
export const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for S3-compatible storage like RustFS
});

export const S3_BUCKET = process.env.S3_BUCKET;
export const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL;

// Ensure bucket exists on startup
export async function ensureBucketExists() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    console.log(`Bucket "${S3_BUCKET}" exists`);
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      console.log(`Creating bucket "${S3_BUCKET}"...`);
      await s3.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
      console.log(`Bucket "${S3_BUCKET}" created successfully`);
    } else {
      console.error("Error checking bucket:", err.message);
    }
  }
}

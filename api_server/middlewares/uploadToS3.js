import multer from "multer";
import { s3 } from "../configs/s3.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";


// Memory storage so multer does NOT stream to S3 directly
const storage = multer.memoryStorage();

export const uploadVideo = multer({ storage });

export async function uploadToS3(req, res, next) {
  if (!req.file) return next();

  const file = req.file;

 const cleanedName = file.originalname
  .toLowerCase()
  .replace(/\s+/g, "_")          
  .replace(/[^a-z0-9._-]/g, ""); 

const fileName = `videos/${Date.now()}-${cleanedName}`;


  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  //  ACL: "public-read",
  };

  try {
    await s3.send(new PutObjectCommand(params));

    // Save URL for controller
    req.file.location = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${fileName}`;

    next();
  } catch (err) {
    console.error("S3 UPLOAD ERROR:", err);
    return res.status(500).json({ message: "S3 upload failed", error: err });
  }
}

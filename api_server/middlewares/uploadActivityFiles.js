import multer from "multer";
import { s3 } from "../configs/s3.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const storage = multer.memoryStorage();

export const uploadActivityMulter = multer({ storage }).fields([
    { name: 'video', maxCount: 1 },
    { name: 'md_file', maxCount: 1 },
    { name: 'starter_code', maxCount: 1 },
    { name: 'quiz_file', maxCount: 1 }
]);

export async function uploadActivityFilesToS3(req, res, next) {
    if (!req.files || Object.keys(req.files).length === 0) return next();

    const uploadFile = async (file, folder) => {
        const cleanedName = file.originalname
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9._-]/g, "");
        const fileName = `${folder}/${Date.now()}-${cleanedName}`;
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        };
        await s3.send(new PutObjectCommand(params));
        return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${fileName}`;
    }

    try {
        if (req.files['video'] && req.files['video'][0]) {
            const url = await uploadFile(req.files['video'][0], 'videos');
            req.body.video_url = url;
        }

        if (req.files['md_file'] && req.files['md_file'][0]) {
            const url = await uploadFile(req.files['md_file'][0], 'docs');
            req.body.md_file_url = url;
        }

        if (req.files['starter_code'] && req.files['starter_code'][0]) {
            const url = await uploadFile(req.files['starter_code'][0], 'starter-code');
            req.body.starter_code_url = url;
        }

        if (req.files['quiz_file'] && req.files['quiz_file'][0]) {
            const url = await uploadFile(req.files['quiz_file'][0], 'quizzes');
            req.body.quiz_url = url;
        }
        next();
    } catch (err) {
        console.error("S3 UPLOAD ERROR:", err);
        return res.status(500).json({ message: "S3 upload failed", error: err.message });
    }
}

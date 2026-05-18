import multer from "multer";
import { s3, S3_BUCKET, S3_PUBLIC_URL } from "../configs/s3.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const storage = multer.memoryStorage();

export const uploadActivityMulter = multer({ storage }).fields([
    { name: 'video', maxCount: 1 },
    { name: 'md_file', maxCount: 1 },
    { name: 'starter_code', maxCount: 1 },
    { name: 'quiz_file', maxCount: 1 },
    { name: 'tests_manifest', maxCount: 1 }
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
            Bucket: S3_BUCKET,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        };
        await s3.send(new PutObjectCommand(params));
        return `${S3_PUBLIC_URL}/${S3_BUCKET}/${fileName}`;
    }

    try {
        if (req.files['video'] && req.files['video'][0]) {
            const url = await uploadFile(req.files['video'][0], 'videos');
            req.body.video_url = url;
        }

        if (req.files['md_file'] && req.files['md_file'][0]) {
            const file = req.files['md_file'][0];
            const url = await uploadFile(file, 'docs');
            req.body.md_file_url = url;
            // Keep raw content in memory for GitHub repo creation (avoids re-fetching from S3)
            req.body._md_content = file.buffer.toString('utf-8');
        }

        if (req.files['starter_code'] && req.files['starter_code'][0]) {
            const file = req.files['starter_code'][0];
            const url = await uploadFile(file, 'starter-code');
            req.body.starter_code_url = url;
            // Keep raw content in memory for GitHub repo creation
            req.body._starter_code_content = file.buffer.toString('utf-8');
        }

        if (req.files['quiz_file'] && req.files['quiz_file'][0]) {
            const url = await uploadFile(req.files['quiz_file'][0], 'quizzes');
            req.body.quiz_url = url;
        }

        if (req.files['tests_manifest'] && req.files['tests_manifest'][0]) {
            const file = req.files['tests_manifest'][0];
            const url = await uploadFile(file, 'tests');
            req.body.tests_url = url;
            // Keep the parsed manifest in memory so the activity controller can
            // push the test files to the GitHub assignment repo without re-fetching from S3.
            try {
                req.body._tests_manifest_parsed = JSON.parse(file.buffer.toString('utf-8'));
            } catch (parseErr) {
                console.warn('[tests_manifest] failed to parse JSON:', parseErr.message);
            }
        }
        next();
    } catch (err) {
        console.error("S3 UPLOAD ERROR:", err);
        return res.status(500).json({ message: "S3 upload failed", error: err.message });
    }
}

import express from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import UserController from "../controllers/UserController.js";
import { s3, S3_BUCKET } from "../configs/s3.js";

const upload = multer({
  storage: multerS3({
    s3,
    bucket: S3_BUCKET,
    key: (req, file, cb) => cb(null, `profile-pictures/${req.params.firebaseUid}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

const router = express.Router();

router.post("/", UserController.createUser);
router.get("/", UserController.getAllUsers);
router.post("/:firebaseUid/profile/avatar", upload.single("avatar"), UserController.uploadAvatar);
router.get("/:firebaseUid/profile", UserController.getProfile);
router.put("/:firebaseUid/profile", UserController.updateProfile);
router.get("/:id", UserController.getUserById);
router.put("/:id", UserController.updateUser);
router.delete("/:id", UserController.deleteUser);

export default router;

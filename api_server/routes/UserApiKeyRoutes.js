import express from "express";
import UserApiKeyController from "../controllers/UserApiKeyController.js";

const router = express.Router({ mergeParams: true });

router.put("/", UserApiKeyController.saveOrUpdate);
router.get("/", UserApiKeyController.getByFirebaseUid);
router.delete("/:id", UserApiKeyController.deleteKey);
router.get("/:id/raw", UserApiKeyController.getRawKey);

export default router;

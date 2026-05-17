import express from "express";
import RewardController from "../controllers/rewardController.js";
import { requireSelfOrInstructorOf } from "../middlewares/requireSelfOrInstructorOf.js";
import { requireInstructor } from "../middlewares/requireInstructor.js";
import { resolveUserParam } from "../utils/resolveUserParam.js";

const router = express.Router();

const targetFromParams = (req) => resolveUserParam(req.params.userId);

router.get(
    "/users/:userId/rewards",
    requireSelfOrInstructorOf(targetFromParams),
    RewardController.getRewards,
);

router.get(
    "/users/:userId/rewards/history",
    requireSelfOrInstructorOf(targetFromParams),
    RewardController.getRewardsHistory,
);

// Public-on-profile per the plan — still behind the global Firebase auth.
router.get("/users/:userId/badges", RewardController.getBadges);

router.post("/badges/bug-hunter", requireInstructor, RewardController.awardBugHunter);

export default router;

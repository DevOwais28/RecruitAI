import express from "express";
import {
    signup,
    login,
    getMe,
    updateProfile,
} from "../controllers/auth.controller.js";

import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
const router = express.Router();

// POST /api/auth/signup
router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authenticate, authorize("recruiter"), getMe);
router.put("/profile", authenticate, authorize("recruiter"), updateProfile);
export default router;
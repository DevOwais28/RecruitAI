import express from "express";
import { createJob, getMyJobs, getJobById, updateJob, deleteJob } from "../controllers/job.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.post("/", authenticate, authorize("recruiter"), createJob);
router.get("/", authenticate, authorize("recruiter"), getMyJobs);
router.get("/:id", authenticate, authorize("recruiter"), getJobById);
router.put("/:id", authenticate, authorize("recruiter"), updateJob)
router.delete("/:id", authenticate, authorize("recruiter"), deleteJob)
export default router;
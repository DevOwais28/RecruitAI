import express from "express";
import {
    uploadCandidateResume,
    getRankedCandidates,
    getCandidateResumeDownload,
    getAllCandidates,
    deleteCandidate,
} from "../controllers/candidate.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import { uploadResume } from "../middlewares/upload.js";

const router = express.Router();

router.post(
    "/upload",
    authenticate,
    authorize("recruiter"),
    uploadResume.single("resume"),
    uploadCandidateResume,
);

router.get(
    "/jobs/:jobId/ranked",
    authenticate,
    authorize("recruiter"),
    getRankedCandidates,
);

router.get(
    "/:candidateId/resume",
    authenticate,
    authorize("recruiter"),
    getCandidateResumeDownload,
);

router.get(
    "/",
    authenticate,
    authorize("recruiter"),
    getAllCandidates,
);

router.delete("/:candidateId", authenticate, authorize("recruiter"), deleteCandidate);

export default router;
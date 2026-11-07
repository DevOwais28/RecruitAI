import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import {
    connectGmail,
    gmailCallback,
    getGmailStatus,
    disconnectGmail,
    scanGmail,
    importGmailCV,
    getDiscoveredGmailCVs,
    clearDiscoveredGmailCVs,
} from "../controllers/gmail.controller.js";

const router = express.Router();

router.get("/connect", authenticate, authorize("recruiter"), connectGmail);
router.get("/callback", gmailCallback);
router.get("/status", authenticate, authorize("recruiter"), getGmailStatus);
router.delete("/disconnect", authenticate, authorize("recruiter"), disconnectGmail);
router.get("/scan", authenticate, authorize("recruiter"), scanGmail);
router.post(
    "/import",
    authenticate,
    authorize("recruiter"),
    importGmailCV
);
router.get(
    "/discovered",
    authenticate,
    authorize("recruiter"),
    getDiscoveredGmailCVs
);
router.delete(
    "/discovered",
    authenticate,
    authorize("recruiter"),
    clearDiscoveredGmailCVs
);

export default router;
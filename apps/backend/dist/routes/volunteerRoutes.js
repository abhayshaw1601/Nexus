"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const volunteerController_1 = require("../controllers/volunteerController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const cloudinary_1 = require("../utils/cloudinary");
const router = (0, express_1.Router)();
router.post('/submit-details', authMiddleware_1.auth, cloudinary_1.uploadIdProof.single('idProof'), volunteerController_1.submitDetails);
exports.default = router;

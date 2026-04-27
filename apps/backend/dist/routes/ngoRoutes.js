"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ngoController_1 = require("../controllers/ngoController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/pending-reports', authMiddleware_1.auth, (0, authMiddleware_1.authorize)('NGO_ADMIN'), ngoController_1.getPendingReports);
exports.default = router;

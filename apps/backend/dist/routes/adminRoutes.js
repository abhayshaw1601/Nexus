"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Only NGO Admins and Super Admins can access these routes
router.use(authMiddleware_1.auth);
router.use((0, authMiddleware_1.authorize)('NGO_ADMIN', 'SUPER_ADMIN'));
router.get('/volunteers/pending', adminController_1.getPendingVolunteers);
router.put('/volunteers/:id/verify', adminController_1.updateVolunteerStatus);
exports.default = router;

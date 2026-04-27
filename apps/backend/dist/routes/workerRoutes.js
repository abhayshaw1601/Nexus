"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const workerController_1 = require("../controllers/workerController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/save-draft', authMiddleware_1.auth, (0, authMiddleware_1.authorize)('FIELD_WORKER'), workerController_1.saveDraft);
router.post('/submit', authMiddleware_1.auth, (0, authMiddleware_1.authorize)('FIELD_WORKER'), workerController_1.submitReport);
exports.default = router;

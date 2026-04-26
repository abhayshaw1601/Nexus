"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const surveyController_1 = require("../controllers/surveyController");
const multer_1 = require("../utils/multer");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Field Worker routes
router.post('/save-draft', authMiddleware_1.auth, (0, authMiddleware_1.authorize)('FIELD_WORKER'), surveyController_1.saveDraft);
router.post('/submit', authMiddleware_1.auth, (0, authMiddleware_1.authorize)('FIELD_WORKER'), surveyController_1.submitSurvey);
router.post('/upload', authMiddleware_1.auth, (0, authMiddleware_1.authorize)('FIELD_WORKER'), multer_1.upload.single('file'), surveyController_1.uploadSurvey);
// NGO Admin routes
router.get('/pending', authMiddleware_1.auth, (0, authMiddleware_1.authorize)('NGO_ADMIN'), surveyController_1.getPendingSurveys);
router.post('/verify', authMiddleware_1.auth, (0, authMiddleware_1.authorize)('NGO_ADMIN'), surveyController_1.verifySurvey);
exports.default = router;

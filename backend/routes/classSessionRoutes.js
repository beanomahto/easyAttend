// routes/classSessionRoutes.js
const express = require("express");
const classSessionController = require("../controllers/classSessionController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/start",
    protect,
    restrictTo('professor'),
    classSessionController.startClassSession
);

router.post(
    "/end",
    protect,
    restrictTo('professor'),
    classSessionController.endClassSession
);

router.get(
    "/my-active",
    protect,
    restrictTo('professor'),
    classSessionController.getMyActiveSession
);

module.exports = router;
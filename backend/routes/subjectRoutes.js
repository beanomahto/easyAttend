const express = require("express");
const { createSubject } = require("../controllers/subjectController");
const router = express.Router();

router.post("/", createSubject);

module.exports = router;

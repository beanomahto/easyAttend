const express = require("express");
const { createProfessor } = require("../controllers/professorController");
const router = express.Router();

router.post("/", createProfessor);

module.exports = router;
